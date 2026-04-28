import { CreateAuthenticatedSessionParams } from "../../constants/types/params.types";
import { RefreshTokenPayload } from "../../constants/types/utils.types";
import sessionModel from "../../shared/models/session";
import { hashToken } from "../../shared/utils/hash";
import { refreshTokenSignOptions, signToken } from "../../shared/utils/jwt";
import { generateUniqueCode } from "../../shared/utils/uuid";

export const createAuthenticatedSession = async ({
  userId,
  role,
  verified,
  userAgent,
  ip,
}: CreateAuthenticatedSessionParams) => {
  const session = await sessionModel.create({
    userId,
    userAgent,
    ip,
    refreshToken: generateUniqueCode(),
  });

  const sessionInfo: RefreshTokenPayload = {
    sessionId: session._id,
  };

  const refreshToken = signToken(sessionInfo, refreshTokenSignOptions);

  session.refreshToken = hashToken(refreshToken);
  await session.save();

  const accessToken = signToken({
    ...sessionInfo,
    userId,
    role,
    verified,
  });

  return {
    session,
    accessToken,
    refreshToken,
  };
};
