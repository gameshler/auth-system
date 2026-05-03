import speakeasy from "speakeasy";
import crypto from "crypto";
import appAssert from "../../../shared/utils/appAssert";
import {
  BAD_REQUEST,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "../../../constants/http";
import { hashSecret } from "../../../shared/utils/crypto";

const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

export const assertMfaNotEnabled = (user: any) => {
  appAssert(!user.mfa.enabled, BAD_REQUEST, "MFA already enabled");
};

export const assertTempSecretExists = (user: any) => {
  appAssert(user.mfa.tempSecret, BAD_REQUEST, "Setup session expired");
};

export const assertValidTotp = (secret: string, code: string) => {
  const isValid = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 1,
  });
  appAssert(isValid, BAD_REQUEST, "Invalid verification code");
};

export const assertNotLocked = (user: any) => {
  if (user.mfa.lockoutUntil && user.mfa.lockoutUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (user.mfa.lockoutUntil.getTime() - Date.now()) / 60000,
    );
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      `Account locked. Try again in ${minutesLeft}m.`,
    );
  }
};

export const assertValidCode = (
  code: string,
  secret: string,
  backupCodes: string[],
  lastUsedStep: number,
  currentStep: number,
) => {
  const isValidTotp = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (isValidTotp && lastUsedStep === currentStep) {
    appAssert(false, UNAUTHORIZED, "Code already used.");
  }

  let backupCodeIndex = -1;
  if (!isValidTotp) {
    const inputHash = hashSecret(code);
    backupCodeIndex = backupCodes.findIndex((storedHash) =>
      safeEqual(storedHash, inputHash),
    );
  }

  if (!isValidTotp && backupCodeIndex === -1) {
    appAssert(false, UNAUTHORIZED, "Invalid MFA code");
  }

  if (isValidTotp && lastUsedStep === currentStep) {
    appAssert(false, UNAUTHORIZED, "Code already used");
  }
};

export const assertMfaEnabled = (user: any) => {
  appAssert(user.mfa.enabled, BAD_REQUEST, "MFA is not enabled");
};

export const assertPasswordValid = async (user: any, password: string) => {
  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid password");
};
