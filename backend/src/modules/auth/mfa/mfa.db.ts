import UserModel from "../../../shared/models/user";
import verificationCodeModel from "../../../shared/models/verificationCode";
import verificationCodeType from "../../../constants/enums/verificationCodeTypes";
import sessionModel from "../../../shared/models/session";
import appAssert from "../../../shared/utils/appAssert";
import { BAD_REQUEST, UNAUTHORIZED } from "../../../constants/http";
import mongoose from "mongoose";
import { ErrorMessages } from "../../../shared/utils/errorMessages";
import AppErrorCode from "../../../constants/enums/AppErrorCode";

export const getUserForMfaSetup = async (userId: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(userId).lean();

  appAssert(
    user,
    UNAUTHORIZED,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.Unauthorized,
  );

  return user;
};

export const setTempSecret = async (
  userId: mongoose.Types.ObjectId,
  tempSecret: string,
) => {
  await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        "mfa.tempSecret": tempSecret,
        "mfa.tempSecretCreatedAt": new Date(),
      },
    },
  );
};

export const getUserWithTempSecret = async (
  userId: mongoose.Types.ObjectId,
) => {
  const user = await UserModel.findById(userId).select(
    "+mfa.tempSecret +mfa.tempSecretCreatedAt +mfa.lastUsedStep",
  );

  appAssert(
    user,
    UNAUTHORIZED,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.Unauthorized,
  );

  return user;
};

export const enableMfa = async (
  userId: mongoose.Types.ObjectId,
  mfaData: { secret: string; backupCodes: string[]; lastUsedStep: number },
) => {
  await UserModel.updateOne(
    { _id: userId },
    {
      $set: {
        "mfa.enabled": true,
        "mfa.secret": mfaData.secret,
        "mfa.backupCodes": mfaData.backupCodes,
        "mfa.lastUsedStep": mfaData.lastUsedStep,
        "mfa.failedAttempts": 0,
        "mfa.lockoutUntil": null,
      },
      $unset: { "mfa.tempSecret": "", "mfa.tempSecretCreatedAt": "" },
    },
  );
};

export const getValidChallenge = async (challengeId: string) => {
  const challenge = await verificationCodeModel
    .findOne({
      _id: challengeId,
      type: verificationCodeType.Mfa_Auth,
      expiresAt: { $gt: new Date() },
    })
    .lean();

  appAssert(
    challenge,
    UNAUTHORIZED,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.InvalidMfaCode,
  );

  return challenge;
};

export const getUserForMfaLogin = async (userId: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(userId).select(
    "+mfa.secret +mfa.backupCodes +mfa.lockoutUntil +mfa.failedAttempts +mfa.lastUsedStep",
  );

  appAssert(
    user,
    UNAUTHORIZED,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.Unauthorized,
  );

  return user;
};

export const consumeSuccessfulLogin = async (
  userId: mongoose.Types.ObjectId,
  challengeId: string,
) => {
  const deleted = await verificationCodeModel.deleteOne({ _id: challengeId });
  appAssert(
    deleted.deletedCount === 1,
    UNAUTHORIZED,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.InvalidMfaCode,
  );

  await UserModel.updateOne(
    { _id: userId },
    { $set: { "mfa.failedAttempts": 0, "mfa.lockoutUntil": null } },
  );
};

export const registerFailedMfaAttempt = async (
  userId: mongoose.Types.ObjectId,
) => {
  const LOCKOUT_THRESHOLD = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000;
  const now = new Date();
  const lockoutUntilDate = new Date(now.getTime() + LOCKOUT_DURATION);

  const determineCurrentAttempts = {
    $cond: {
      if: {
        $and: [
          { $ifNull: ["$mfa.lockoutUntil", false] },
          { $lte: ["$mfa.lockoutUntil", now] },
        ],
      },
      then: 1,
      else: { $add: [{ $ifNull: ["$mfa.failedAttempts", 0] }, 1] },
    },
  };

  await UserModel.updateOne({ _id: userId }, [
    {
      $set: {
        "mfa.failedAttempts": determineCurrentAttempts,
        "mfa.lockoutUntil": {
          $cond: {
            if: { $gte: [determineCurrentAttempts, LOCKOUT_THRESHOLD] },
            then: lockoutUntilDate,
            else: {
              $cond: {
                if: { $lte: [{ $ifNull: ["$mfa.lockoutUntil", now] }, now] },
                then: null,
                else: "$mfa.lockoutUntil",
              },
            },
          },
        },
      },
    },
  ]);
};

export const consumeBackupCode = async (
  userId: mongoose.Types.ObjectId,
  hashedCode: string,
) => {
  const result = await UserModel.updateOne(
    {
      _id: userId,
      "mfa.backupCodes": hashedCode,
    },
    {
      $pull: {
        "mfa.backupCodes": hashedCode,
      },
    },
  );

  appAssert(
    result.modifiedCount === 1,
    BAD_REQUEST,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.InvalidMfaCode,
  );
};

export const updateLastUsedStep = async (
  userId: mongoose.Types.ObjectId,
  step: number,
) => {
  await UserModel.updateOne(
    { _id: userId },
    { $set: { "mfa.lastUsedStep": step } },
  );
};

export const getUserForDisableMfa = async (userId: mongoose.Types.ObjectId) => {
  const user = await UserModel.findById(userId).select("+password");

  appAssert(
    user,
    UNAUTHORIZED,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.Unauthorized,
  );

  return user;
};

export const disableMfaInternal = async (userId: mongoose.Types.ObjectId) => {
  await Promise.all([
    UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          "mfa.enabled": false,
          "mfa.backupCodes": [],
          "mfa.lastUsedStep": 0,
          "mfa.failedAttempts": 0,
          "mfa.lockoutUntil": null,
        },
        $unset: { "mfa.secret": "", "mfa.tempSecret": "" },
      },
    ),
    sessionModel.deleteMany({ userId }),
  ]);
};

export const updateBackupCodes = async (
  userId: mongoose.Types.ObjectId,
  backupCodes: string[],
) => {
  await UserModel.updateOne(
    { _id: userId },
    { $set: { "mfa.backupCodes": backupCodes } },
  );
};
