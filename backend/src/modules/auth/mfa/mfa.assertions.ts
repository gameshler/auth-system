import speakeasy from "speakeasy";
import crypto from "crypto";
import appAssert from "../../../shared/utils/appAssert";
import {
  BAD_REQUEST,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "../../../constants/http";
import { hashSecret } from "../../../shared/utils/crypto";
import { ErrorMessages } from "../../../shared/utils/errorMessages";
import AppErrorCode from "../../../constants/enums/AppErrorCode";

export const safeEqual = (a: string, b: string): boolean => {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");

    if (bufA.length !== bufB.length) return false;

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

export const assertMfaNotEnabled = (user: any) => {
  appAssert(
    !user.mfa.enabled,
    BAD_REQUEST,
    ErrorMessages.AccountOperationFailed,
    AppErrorCode.MfaAlreadyEnabled,
  );
};

export const assertTempSecretExists = (user: any) => {
  appAssert(
    user.mfa.tempSecret,
    BAD_REQUEST,
    ErrorMessages.InvalidSession,
    AppErrorCode.SessionExpired,
  );

  const TEN_MINUTES = 10 * 60 * 1000;

  appAssert(
    user.mfa.tempSecretCreatedAt &&
      Date.now() - user.mfa.tempSecretCreatedAt.getTime() < TEN_MINUTES,
    BAD_REQUEST,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.SessionExpired,
  );
};

export const verifyTotpOrThrow = (
  secret: string,
  code: string,
  lastUsedStep: number,
) => {
  const currentStep = Math.floor(Date.now() / 30000);

  const result = speakeasy.totp.verifyDelta({
    secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  appAssert(
    result,
    BAD_REQUEST,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.InvalidMfaCode,
  );

  const verifiedStep = currentStep + result.delta;

  appAssert(
    verifiedStep > lastUsedStep,
    UNAUTHORIZED,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.InvalidMfaCode,
  );

  return verifiedStep;
};

export const assertNotLocked = (user: any) => {
  if (user.mfa.lockoutUntil && user.mfa.lockoutUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.mfa.lockoutUntil.getTime() - Date.now()) / 60000,
    );

    appAssert(
      false,
      TOO_MANY_REQUESTS,
      `Too many attempts. Try again in ${minutesLeft}m.`,
      AppErrorCode.TooManyRequests,
    );
  }
};

export const assertMfaEnabled = (user: any) => {
  appAssert(
    user.mfa.enabled,
    BAD_REQUEST,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.InvalidCredentials,
  );
};

export const assertPasswordValid = async (user: any, password: string) => {
  const isValid = await user.comparePassword(password);

  appAssert(
    isValid,
    UNAUTHORIZED,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.InvalidCredentials,
  );
};

export const findMatchingBackupCode = (code: string, backupCodes: string[]) => {
  const inputHash = hashSecret(code);

  return backupCodes.find((storedHash) => safeEqual(storedHash, inputHash));
};
