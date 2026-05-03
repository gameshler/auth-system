import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { createAuthenticatedSession } from "../auth.helpers";
import {
  decryptSecret,
  encryptSecret,
  hashSecret,
  generateBackupCodes,
} from "../../../shared/utils/crypto";
import {
  DisableMfaParams,
  MfaLoginParams,
  MfaSetupParams,
  RegenBackupCodesParams,
  UserParams,
} from "../../../constants/types/params.types";
import {
  consumeSuccessfulLogin,
  disableMultifa,
  enableMfa,
  getUserForDisableMfa,
  getUserForMfaLogin,
  getUserForMfaSetup,
  getUserWithTempSecret,
  getValidChallenge,
  setTempSecret,
  updateBackupCodes,
} from "./mfa.db";
import {
  assertMfaEnabled,
  assertMfaNotEnabled,
  assertNotLocked,
  assertPasswordValid,
  assertTempSecretExists,
  assertValidCode,
  assertValidTotp,
} from "./mfa.assertions";

const getTotpStep = () => Math.floor(Date.now() / 30000);

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
  return { qrImageUrl, manualKey: secret.base32 };
};

export const verifyMfaSetup = async (params: MfaSetupParams) => {
  const { userId, code } = params;
  const user = await getUserWithTempSecret(userId);
  assertTempSecretExists(user);

  const decryptedSecret = decryptSecret(user.mfa.tempSecret!);
  assertValidTotp(decryptedSecret, code);

  const plainBackups = generateBackupCodes();
  const hashedBackups = plainBackups.map(hashSecret);

  await enableMfa(userId, {
    secret: user.mfa.tempSecret!,
    backupCodes: hashedBackups,
    lastUsedStep: getTotpStep(),
  });

  return { backupCodes: plainBackups, user: user.omitPassword() };
};

export const verifyMfaLogin = async (params: MfaLoginParams) => {
  const { challengeId, code, userAgent, ip } = params;

  const challenge = await getValidChallenge(challengeId);
  const user = await getUserForMfaLogin(challenge.userId);

  assertNotLocked(user);
  assertValidCode(
    code,
    decryptSecret(user.mfa.secret!),
    user.mfa.backupCodes,
    user.mfa.lastUsedStep ?? 0,
    getTotpStep(),
  );

  await consumeSuccessfulLogin(user._id!, challengeId, code);

  const { accessToken, refreshToken } = await createAuthenticatedSession({
    userId: user._id!,
    role: user.role,
    verified: user.verified,
    userAgent,
    ip,
  });

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const disableMfa = async (params: DisableMfaParams) => {
  const { userId, password } = params;
  const user = await getUserForDisableMfa(userId);
  assertMfaEnabled(user);
  await assertPasswordValid(user, password);

  await disableMultifa(userId);
};

export const regenerateBackupCodes = async (params: RegenBackupCodesParams) => {
  const { userId, password } = params;
  const user = await getUserForDisableMfa(userId);
  assertMfaEnabled(user);
  await assertPasswordValid(user, password);

  const plainBackups = generateBackupCodes();
  const hashedBackups = plainBackups.map(hashSecret);

  await updateBackupCodes(userId, hashedBackups);
  return { backupCodes: plainBackups };
};
