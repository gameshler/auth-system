import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import { JWT_REFRESH_SECRET, JWT_SECRET } from "../../constants/env";
import Audience from "../../constants/enums/audience";
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  SignOptionsAndSecret,
} from "../../constants/types/utils.types";

const defaults: SignOptions = {
  audience: [Audience.User],
};
const verifyDefaults: VerifyOptions = {
  audience: Audience.User,
};
const accessTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "15m",
  secret: JWT_SECRET,
};

export const refreshTokenSignOptions: SignOptionsAndSecret = {
  expiresIn: "7d",
  secret: JWT_REFRESH_SECRET,
};

export const signToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
  options?: SignOptionsAndSecret,
) => {
  const { secret, ...signOpts } = options || accessTokenSignOptions;
  return jwt.sign(payload, secret, { ...defaults, ...signOpts });
};

export const verifyToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions & { secret?: string },
) => {
  const { secret = JWT_SECRET, ...verifyOpts } = options || {};

  try {
    const decoded = jwt.verify(token, secret, {
      ...verifyDefaults,
      ...verifyOpts,
    });

    return {
      payload: decoded as TPayload,
    };
  } catch (error: any) {
    return {
      error: error.message,
    };
  }
};
