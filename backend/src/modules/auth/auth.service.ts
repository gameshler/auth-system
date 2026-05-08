import AppErrorCode from "../../constants/enums/AppErrorCode";
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
  UserParams,
} from "../../constants/types/params.types";
import {
  LoginResult,
  RefreshTokenPayload,
} from "../../constants/types/utils.types";
import sessionModel from "../../shared/models/session";
import UserModel from "../../shared/models/user";
import verificationCodeModel from "../../shared/models/verificationCode";
import appAssert from "../../shared/utils/appAssert";
import {
  fifteenminutesFromNow,
  fiveMinutesAgo,
  fiveminutesFromNow,
  tenminutesFromNow,
} from "../../shared/utils/date";
import {
  getSecurityAlertTemplate,
  getVerifyEmailTemplate,
} from "../../shared/utils/emailTemplates";
import { ErrorMessages } from "../../shared/utils/errorMessages";
import {
  refreshTokenSignOptions,
  signToken,
  verifyToken,
} from "../../shared/utils/jwt";
import { sendMail } from "../../shared/utils/sendMail";
import { generateUniqueCode, hashCode } from "../../shared/utils/crypto";
import { createAuthenticatedSession } from "./auth.helpers";

export const createAccount = async (params: CreateAccountParams) => {
  const { fullName, email, password, userAgent, ip } = params;
  const existingUser = await UserModel.exists({ email });

  appAssert(
    !existingUser,
    CONFLICT,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.InvalidCredentials,
  );

  const user = await UserModel.create({
    fullName,
    email,
    password,
  });

  const userId = user._id;
  const code = generateUniqueCode();
  await verificationCodeModel.create({
    userId,
    code: hashCode(code),
    type: verificationCodeType.EmailVerification,
    expiresAt: fifteenminutesFromNow(),
  });

  const url = `${CLIENT_URL}/email/verify/${code}`;

  await sendMail({
    to: user.email,
    ...getVerifyEmailTemplate(url),
  });

  const { accessToken, refreshToken } = await createAuthenticatedSession({
    userId,
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

export const loginUser = async (params: LoginParams): Promise<LoginResult> => {
  const { email, password, userAgent, ip } = params;
  const user = await UserModel.findOne({ email });

  appAssert(
    user && (await user.comparePassword(password)),
    UNAUTHORIZED,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.InvalidCredentials,
  );

  if (user.mfa.enabled) {
    const challenge = await verificationCodeModel.create({
      userId: user._id,
      type: verificationCodeType.Mfa_Auth,
      expiresAt: fiveminutesFromNow(),
    });

    return {
      mfaRequired: true,
      challengeId: String(challenge._id),
      message: "MFA required",
    };
  }

  const { accessToken, refreshToken } = await createAuthenticatedSession({
    userId: user._id,
    role: user.role,
    verified: user.verified,
    userAgent,
    ip,
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
  });

  return {
    mfaRequired: false,
    user: user.omitPassword(),
    accessToken,
    refreshToken,
  };
};

export const refreshUserAccessToken = async (refreshToken: string) => {
  const { payload } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });
  appAssert(
    payload,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.InvalidSession,
  );
  const session = await sessionModel.findById(payload.sessionId);
  const now = Date.now();
  appAssert(
    session,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.InvalidSession,
  );
  appAssert(
    session.expiresAt.getTime() > now,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.SessionExpired,
  );
  const valid = session.refreshToken === hashCode(refreshToken);
  appAssert(
    valid,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.InvalidSession,
  );

  const sessionInfo: RefreshTokenPayload = {
    sessionId: session._id,
  };

  const newRefreshToken = signToken(sessionInfo, refreshTokenSignOptions);
  const updated = await sessionModel.findOneAndUpdate(
    {
      _id: payload.sessionId,
      refreshToken: hashCode(refreshToken),
    },
    {
      refreshToken: hashCode(newRefreshToken),
    },
    { returnDocument: "after" },
  );

  appAssert(
    updated,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.InvalidSession,
  );

  const user = await UserModel.findById(session.userId);
  appAssert(
    user,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.InvalidSession,
  );

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
    code: hashCode(code),
    type: verificationCodeType.EmailVerification,
    expiresAt: { $gt: new Date() },
  });
  appAssert(
    validCode,
    NOT_FOUND,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.VerificationFailed,
  );
  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    {
      verified: true,
    },
    { returnDocument: "after" },
  );
  appAssert(
    updatedUser,
    INTERNAL_SERVER_ERROR,
    ErrorMessages.AccountOperationFailed,
    AppErrorCode.VerificationFailed,
  );
  await validCode.deleteOne();
  return {
    user: updatedUser.omitPassword(),
  };
};

export const sendPasswordResetEmail = async (params: ForgotPasswordParams) => {
  const { email, userAgent, ip } = params;
  const user = await UserModel.findOne({ email });
  appAssert(
    user,
    NOT_FOUND,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.InvalidCredentials,
  );
  const fiveMinAgo = fiveMinutesAgo();
  const count = await verificationCodeModel.countDocuments({
    userId: user._id,
    type: verificationCodeType.PasswordReset,
    createdAt: { $gt: fiveMinAgo },
  });
  appAssert(
    count <= 1,
    TOO_MANY_REQUESTS,
    ErrorMessages.TooManyRequests,
    AppErrorCode.TooManyRequests,
  );
  const code = generateUniqueCode();
  const expiresAt = tenminutesFromNow();
  await verificationCodeModel.create({
    userId: user._id,
    type: verificationCodeType.PasswordReset,
    code: hashCode(code),
    expiresAt,
  });
  const url = `${CLIENT_URL}/password/reset?code=${
    code
  }&exp=${expiresAt.getTime()}`;

  const { data } = await sendMail({
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
    ErrorMessages.ServerError,
    AppErrorCode.ServerError,
  );

  return {
    url,
    emailId: data.id,
  };
};

export const resetPassword = async (params: ResetPasswordParams) => {
  const { password, verificationCode, userAgent, ip } = params;
  const validCode = await verificationCodeModel.findOne({
    code: hashCode(verificationCode),
    type: verificationCodeType.PasswordReset,
    expiresAt: { $gt: new Date() },
  });
  appAssert(
    validCode,
    NOT_FOUND,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.VerificationFailed,
  );
  const user = await UserModel.findById(validCode.userId);

  appAssert(
    user,
    NOT_FOUND,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.VerificationFailed,
  );
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

export const deleteUserAccount = async (params: UserParams) => {
  const { userId } = params;
  const deletedUser = await UserModel.findByIdAndDelete(userId);
  appAssert(
    deletedUser,
    INTERNAL_SERVER_ERROR,
    ErrorMessages.AccountOperationFailed,
    AppErrorCode.ServerError,
  );

  await sessionModel.deleteMany({ userId });

  await verificationCodeModel.deleteMany({ userId });

  return deletedUser.omitPassword();
};
