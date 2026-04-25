import verificationCodeType from "../../constants/enums/verificationCodeTypes";
import { CLIENT_URL } from "../../constants/env";
import {
  CONFLICT,
  INTERNAL_SERVER_ERROR,
  NOT_FOUND,
  TOO_MANY_REQUESTS,
  UNAUTHORIZED,
} from "../../constants/http";
import {
  CreateAccountParams,
  ForgotPasswordParams,
  LoginParams,
  ResetPasswordParams,
} from "../../constants/types/params.types";
import { RefreshTokenPayload } from "../../constants/types/utils.types";
import sessionModel from "../../shared/models/session";
import UserModel from "../../shared/models/user";
import verificationCodeModel from "../../shared/models/verificationCode";
import appAssert from "../../shared/utils/appAssert";
import {
  fifteenminutesFromNow,
  fiveMinutesAgo,
  sevenDaysFromNow,
  tenminutesFromNow,
} from "../../shared/utils/date";
import {
  getSecurityAlertTemplate,
  getVerifyEmailTemplate,
} from "../../shared/utils/emailTemplates";
import { hashToken } from "../../shared/utils/hash";
import {
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../../shared/utils/jwt";
import { sendMail } from "../../shared/utils/sendMail";
import { randomUUID as uuidv4 } from "crypto";

export const createAccount = async (params: CreateAccountParams) => {
  const { fullName, email, password, userAgent, ip } = params;
  const existingUser = await UserModel.exists({ email });

  appAssert(!existingUser, CONFLICT, "Email already exists");

  const user = await UserModel.create({
    fullName,
    email,
    password,
  });

  const userId = user._id;
  const code = uuidv4();
  await verificationCodeModel.create({
    userId,
    code: hashToken(code),
    type: verificationCodeType.EmailVerification,
    expiresAt: fifteenminutesFromNow(),
  });

  const url = `${CLIENT_URL}/email/verify/${code}`;

  const { error } = await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  if (error) {
    console.log(error);
  }

  const session = await sessionModel.create({
    userId,
    userAgent,
    ip,
    refreshToken: uuidv4(),
  });

  const refreshToken = signToken(
    {
      sessionId: session._id,
    },
    refreshTokenSignOptions,
  );

  session.refreshToken = hashToken(refreshToken);
  await session.save();

  const accessToken = signToken({
    userId,
    sessionId: session._id,
    role: user.role,
    verified: user.verified,
  });

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (params: LoginParams) => {
  const { email, password, userAgent, ip } = params;
  const user = await UserModel.findOne({ email });
  appAssert(user, UNAUTHORIZED, "Invalid email or password");
  const isValid = await user.comparePassword(password);
  appAssert(isValid, UNAUTHORIZED, "Invalid email or password");

  const userId = user._id;
  const session = await sessionModel.create({
    userId,
    userAgent,
    ip,
    refreshToken: uuidv4(),
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
    role: user.role,
    verified: user.verified,
  });
  await sendMail({
    to: user.email,
    ...getSecurityAlertTemplate({
      email: user.email,
      title: "New Login Detected",
      action: "Successful sign-in to your account",
      ip,
      userAgent,
      resetPasswordUrl: `${CLIENT_URL}/password/forgot`,
    }),
  }).catch((error) => {
    console.error("Login security email failed:", error);
  });

  return {
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(payload, UNAUTHORIZED, "Invalid refresh token");
  const session = await sessionModel.findById(payload.sessionId);
  const now = Date.now();
  appAssert(
    session && session.expiresAt.getTime() > now,
    UNAUTHORIZED,
    "Session Expired",
  );
  const valid = session.refreshToken === hashToken(refreshToken);
  appAssert(valid, UNAUTHORIZED, "Token reuse detected ");

  const newRefreshToken = signToken(
    {
      sessionId: session._id,
    },
    refreshTokenSignOptions,
  );
  session.refreshToken = hashToken(newRefreshToken);
  session.expiresAt = sevenDaysFromNow();

  const user = await UserModel.findById(session.userId);
  appAssert(user, UNAUTHORIZED, "User not found");

  const accessToken = signToken({
    userId: user._id,
    sessionId: session._id,
    role: user.role,
    verified: user.verified,
  });

  return {
    accessToken,
    newRefreshToken,
  };
};

export const verifyEmail = async (code: string) => {
  const validCode = await verificationCodeModel.findOne({
    code: hashToken(code),
    type: verificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or Expired verification code");
  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { returnDocument: "after" },
  );
  appAssert(updatedUser, INTERNAL_SERVER_ERROR, "Failed to verify email");
  await validCode.deleteOne();
  return {
    user: updatedUser.omitPassword(),
  };
};

export const sendPasswordResetEmail = async (params: ForgotPasswordParams) => {
  const { email, userAgent, ip } = params;
  const user = await UserModel.findOne({ email });
  appAssert(user, NOT_FOUND, "User not found");
  const fiveMinAgo = fiveMinutesAgo();
  const count = await verificationCodeModel.countDocuments({
    userId: user._id,
    type: verificationCodeType.PasswordReset,
    createdAt: { $gt: fiveMinAgo },
  });
  appAssert(
    count <= 1,
    TOO_MANY_REQUESTS,
    "Too many requests,please try again later",
  );
  const code = uuidv4();
  const expiresAt = tenminutesFromNow();
  await verificationCodeModel.create({
    userId: user._id,
    type: verificationCodeType.PasswordReset,
    code: hashToken(code),
    expiresAt,
  });
  const url = `${CLIENT_URL}/password/reset?code=${
    code
  }&exp=${expiresAt.getTime()}`;

  const { data, error } = await sendMail({
    to: user.email,
    ...getSecurityAlertTemplate({
      email: user.email,
      title: "Password Reset Requested",
      action: "A password reset was requested for your account",
      resetPasswordUrl: url,
      ip,
      userAgent,
    }),
  });
  appAssert(
    data?.id,
    INTERNAL_SERVER_ERROR,
    `${error?.name} - ${error?.message}`,
  );

  return {
    url,
    emailId: data.id,
  };
};

export const resetPassword = async (params: ResetPasswordParams) => {
  const { password, verificationCode, userAgent, ip } = params;
  const validCode = await verificationCodeModel.findOne({
    code: hashToken(verificationCode),
    type: verificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });
  appAssert(validCode, NOT_FOUND, "Invalid or Expired verification code");
  const user = await UserModel.findById(validCode.userId);

  appAssert(user, NOT_FOUND, "User not found");
  user.password = password;
  await user.save();

  await validCode.deleteOne();
  await sessionModel.deleteMany({ userId: user._id });
  await sendMail({
    to: user.email,
    ...getSecurityAlertTemplate({
      email: user.email,
      title: "Password Changed",
      action: "Your account password was successfully changed",
      ip,
      userAgent,
    }),
  }).catch((error) => {
    console.error("Password changed alert email failed:", error);
  });
  return {
    user: user.omitPassword(),
  };
};

export const deleteUserAccount = async (userId: string) => {
  const user = await UserModel.findByIdAndDelete(userId);
  appAssert(user, NOT_FOUND, "User not found");

  await sessionModel.deleteMany({ userId });

  await verificationCodeModel.deleteMany({ userId });

  return user.omitPassword();
};
