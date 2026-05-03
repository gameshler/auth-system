import UserModel from "../../../shared/models/user";
import verificationCodeModel from "../../../shared/models/verificationCode";
import verificationCodeType from "../../../constants/enums/verificationCodeTypes";
import sessionModel from "../../../shared/models/session";
import appAssert from "../../../shared/utils/appAssert";
import { UNAUTHORIZED } from "../../../constants/http";
import mongoose from "mongoose";

export const getUserForMfaSetup = async (userId: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(userId);
  appAssert(user, UNAUTHORIZED, "User not found");
  return user;
};

export const setTempSecret = async (
  userId: mongoose.Types.ObjectId,
  tempSecret: string,
) => {
  await UserModel.findByIdAndUpdate(userId, { "mfa.tempSecret": tempSecret });
};

export const getUserWithTempSecret = async (
  userId: mongoose.Types.ObjectId,
) => {
  const user = await UserModel.findById(userId).select("+mfa.tempSecret");
  return user!;
};

export const enableMfa = async (
  userId: mongoose.Types.ObjectId,
  mfaData: { secret: string; backupCodes: string[]; lastUsedStep: number },
) => {
  await UserModel.findByIdAndUpdate(userId, {
    "mfa.enabled": true,
    "mfa.secret": mfaData.secret,
    "mfa.tempSecret": undefined,
    "mfa.backupCodes": mfaData.backupCodes,
    "mfa.lastUsedStep": mfaData.lastUsedStep,
  });
};

export const getValidChallenge = async (challengeId: string) => {
  const challenge = await verificationCodeModel.findOne({
    _id: challengeId,
    type: verificationCodeType.Mfa_Auth,
  });
  return challenge!;
};

export const getUserForMfaLogin = async (userId: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(userId).select(
    "+mfa.secret +mfa.backupCodes +mfa.lockoutUntil +mfa.failedAttempts +mfa.lastUsedStep",
  );
  return user!;
};

export const consumeSuccessfulLogin = async (
  userId: mongoose.Types.ObjectId,
  challengeId: string,
  code: string,
) => {
  await sessionModel.deleteMany({ userId });
  await verificationCodeModel.deleteOne({ _id: challengeId });

  await UserModel.findByIdAndUpdate(userId, {
    "mfa.failedAttempts": 0,
    "mfa.lockoutUntil": undefined,
  });

  return { userId, challengeId, code };
};

export const getUserForDisableMfa = async (userId: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(userId).select("+password");
  return user!;
};

export const disableMultifa = async (userId: mongoose.Types.ObjectId) => {
  await UserModel.findByIdAndUpdate(userId, {
    "mfa.enabled": false,
    "mfa.secret": undefined,
    "mfa.tempSecret": undefined,
    "mfa.backupCodes": [],
    "mfa.lastUsedStep": 0,
    "mfa.failedAttempts": 0,
    "mfa.lockoutUntil": undefined,
  });
  await sessionModel.deleteMany({ userId });
};

export const updateBackupCodes = async (
  userId: mongoose.Types.ObjectId,
  backupCodes: string[],
) => {
  await UserModel.findByIdAndUpdate(userId, { "mfa.backupCodes": backupCodes });
};
