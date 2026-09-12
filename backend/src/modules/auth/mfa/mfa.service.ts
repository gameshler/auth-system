import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { createAuthenticatedSession } from "../auth.helpers";
import {
  decryptSecret,
  encryptSecret,
  generateBackupCodes,
  hashSecret,
} from "../../../shared/utils/crypto";
import {
  DisableMfaParams,
  MfaLoginParams,
  MfaSetupParams,
  RegenBackupCodesParams,
  UserParams,
} from "../../../constants/types/params.types";
import {
  consumeBackupCode,
  consumeSuccessfulLogin,
  disableMfaInternal,
  enableMfa,
  getUserForDisableMfa,
  getUserForMfaLogin,
  getUserForMfaSetup,
  getUserWithTempSecret,
  getValidChallenge,
  registerFailedMfaAttempt,
  setTempSecret,
  updateBackupCodes,
  updateLastUsedStep,
} from "./mfa.db";
import {
  assertMfaEnabled,
  assertMfaNotEnabled,
  assertNotLocked,
  assertPasswordValid,
  assertTempSecretExists,
  findMatchingBackupCode,
  verifyTotpOrThrow,
} from "./mfa.assertions";
import appAssert from "../../../shared/utils/appAssert";
import { UNAUTHORIZED } from "../../../constants/http";
import { ErrorMessages } from "../../../shared/utils/errorMessages";
import AppErrorCode from "../../../constants/enums/AppErrorCode";

export const generateMfaSetup = async (params: UserParams) => {
  const { userId } = params;
  const user = await getUserForMfaSetup(userId);

  assertMfaNotEnabled(user);

  const secret = speakeasy.generateSecret({
    name: `Lakos (${user.email})`,
    issuer: "Lakos",
  });
  const encryptedSecret = encryptSecret(secret.base32);

  await setTempSecret(userId, encryptedSecret);

  const qrImageUrl = await qrcode.toDataURL(secret.otpauth_url!);

  return {
    qrImageUrl,
    manualKey: secret.base32,
  };
};

export const verifyMfaSetup = async (params: MfaSetupParams) => {
  const { userId, code } = params;

  const user = await getUserWithTempSecret(userId);

  assertTempSecretExists(user);

  const decryptedSecret = decryptSecret(user.mfa.tempSecret!);
  const verifiedStep = verifyTotpOrThrow(
    decryptedSecret,
    code,
    user.mfa.lastUsedStep ?? 0,
  );
  const plainBackups = generateBackupCodes();
  const hashedBackups = plainBackups.map(hashSecret);

  await enableMfa(userId, {
    secret: user.mfa.tempSecret!,
    backupCodes: hashedBackups,
    lastUsedStep: verifiedStep,
  });

  return {
    backupCodes: plainBackups,
    user: user.omitPassword(),
  };
};

export const verifyMfaLogin = async (params: MfaLoginParams) => {
  const { challengeId, code, userAgent, ip } = params;

  const challenge = await getValidChallenge(challengeId);
  const user = await getUserForMfaLogin(challenge.userId);

  assertNotLocked(user);

  const decryptedSecret = decryptSecret(user.mfa.secret!);
  let verifiedStep: number | null = null;

  const totpResult = speakeasy.totp.verifyDelta({
    secret: decryptedSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (totpResult) {
    const currentStep = Math.floor(Date.now() / 30000);
    verifiedStep = currentStep + totpResult.delta;

    if (verifiedStep <= (user.mfa.lastUsedStep ?? 0)) {
      await registerFailedMfaAttempt(user._id);

      appAssert(
        false,
        UNAUTHORIZED,
        ErrorMessages.InvalidOrExpiredToken,
        AppErrorCode.InvalidMfaCode,
      );
    }

    await updateLastUsedStep(user._id, verifiedStep);
  } else {
    const matchedBackup = findMatchingBackupCode(code, user.mfa.backupCodes);

    if (!matchedBackup) {
      await registerFailedMfaAttempt(user._id);

      appAssert(
        false,
        UNAUTHORIZED,
        ErrorMessages.InvalidOrExpiredToken,
        AppErrorCode.InvalidMfaCode,
      );
    }

    await consumeBackupCode(user._id, matchedBackup);
  }

  const [session] = await Promise.all([
    createAuthenticatedSession({
      userId: user._id,
      role: user.role,
      verified: user.verified,
      userAgent,
      ip,
    }),
    consumeSuccessfulLogin(user._id, challengeId),
  ]);

  return {
    user: user.omitPassword(),
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  };
};

export const disableMfa = async (params: DisableMfaParams) => {
  const { userId, password } = params;

  const user = await getUserForDisableMfa(userId);

  assertMfaEnabled(user);

  await assertPasswordValid(user, password);

  await disableMfaInternal(userId);
};

export const regenerateBackupCodes = async (params: RegenBackupCodesParams) => {
  const { userId, password } = params;

  const user = await getUserForDisableMfa(userId);

  assertMfaEnabled(user);

  await assertPasswordValid(user, password);

  const plainBackups = generateBackupCodes();
  const hashedBackups = plainBackups.map(hashSecret);

  await updateBackupCodes(userId, hashedBackups);

  return {
    backupCodes: plainBackups,
  };
};
