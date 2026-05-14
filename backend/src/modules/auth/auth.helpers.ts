import mongoose from "mongoose";
import { CreateAuthenticatedSessionParams } from "../../constants/types/params.types";
import { RefreshTokenPayload } from "../../constants/types/utils.types";
import sessionModel from "../../shared/models/session";
import { hashCode, hashToken } from "../../shared/utils/crypto";
import { refreshTokenSignOptions, signToken } from "../../shared/utils/jwt";
import verificationCodeType from "../../constants/enums/verificationCodeTypes";
import verificationCodeModel from "../../shared/models/verificationCode";
import appAssert from "../../shared/utils/appAssert";
import { NOT_FOUND } from "../../constants/http";
import { ErrorMessages } from "../../shared/utils/errorMessages";
import AppErrorCode from "../../constants/enums/AppErrorCode";

export const createAuthenticatedSession = async ({
  userId,
  role,
  verified,
  userAgent,
  ip,
}: CreateAuthenticatedSessionParams) => {
  const sessionInfo: RefreshTokenPayload = {
    sessionId: new mongoose.Types.ObjectId(),
  };

  const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);

  const session = await sessionModel.create({
    _id: sessionInfo.sessionId,
    userId,
    userAgent,
    ip,
    refreshToken: hashToken(refreshToken),
  });

  const accessToken = signToken({
    sessionId: session._id,
    userId,
    role,
    verified,
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const consumeVerificationCode = async (
  code: string,
  type: verificationCodeType,
) => {
  const validCode = await verificationCodeModel
    .findOneAndDelete({
      code: hashCode(code),
      type,
      expiresAt: { $gt: new Date() },
    })
    .lean();

  appAssert(
    validCode,
    NOT_FOUND,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.VerificationFailed,
  );

  return validCode;
};
