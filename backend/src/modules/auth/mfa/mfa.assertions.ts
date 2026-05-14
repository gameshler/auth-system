import speakeasy from "speakeasy";
import appAssert from "../../../shared/utils/appAssert";
import {
  BAD_REQUEST,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "../../../constants/http";
import { hashSecret, safeEqual } from "../../../shared/utils/crypto";
import { ErrorMessages } from "../../../shared/utils/errorMessages";
import AppErrorCode from "../../../constants/enums/AppErrorCode";

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
    ErrorMessages.AccountOperationFailed,
    AppErrorCode.SessionExpired,
  );

  const TEN_MINUTES = 10 * 60 * 1000;
  const createdAtTime = user.mfa.tempSecretCreatedAt
    ? new Date(user.mfa.tempSecretCreatedAt).getTime()
    : 0;

  appAssert(
    createdAtTime > 0 && Date.now() - createdAtTime < TEN_MINUTES,
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
  if (user?.mfa?.lockoutUntil) {
    const lockoutTime = new Date(user.mfa.lockoutUntil).getTime();
    const now = Date.now();

    if (lockoutTime > now) {
      const minutesLeft = Math.ceil((lockoutTime - now) / 60000);

      appAssert(
        false,
        TOO_MANY_REQUESTS,
        `Too many attempts. Try again in ${minutesLeft}m.`,
        AppErrorCode.TooManyRequests,
      );
    }
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
