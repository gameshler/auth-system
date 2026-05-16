import AppErrorCode from "../../constants/enums/AppErrorCode";
import verificationCodeType from "../../constants/enums/verificationCodeTypes";
import { CLIENT_URL } from "../../constants/env";
import {
  BAD_REQUEST,
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
  sevenDaysFromNow,
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
import {
  generateUniqueCode,
  hashCode,
  hashToken,
} from "../../shared/utils/crypto";
import {
  consumeVerificationCode,
  createAuthenticatedSession,
  generateAccessToken,
} from "./auth.helpers";
import { registerFailedMfaAttempt } from "./mfa/mfa.db";
import { assertNotLocked } from "./mfa/mfa.assertions";

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

  await Promise.all([
    verificationCodeModel.create({
      userId,
      code: hashCode(code),
      type: verificationCodeType.EmailVerification,
      expiresAt: fifteenminutesFromNow(),
    }),
    sendMail({
      to: user.email,
      ...getVerifyEmailTemplate(`${CLIENT_URL}/email/verify/${code}`),
    }),
  ]);

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
  const user = await UserModel.findOne({ email }).select(
    "+password +mfa.lockoutUntil +mfa.failedAttempts",
  );
  appAssert(
    user,
    UNAUTHORIZED,
    ErrorMessages.InvalidCredentials,
    AppErrorCode.InvalidCredentials,
  );
  user.checkLockout();

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await registerFailedMfaAttempt(user._id);
    appAssert(
      false,
      UNAUTHORIZED,
      ErrorMessages.InvalidCredentials,
      AppErrorCode.InvalidCredentials,
    );
  }

  if (user.mfa.failedAttempts > 0) {
    await UserModel.updateOne(
      { _id: user._id },
      { $set: { "mfa.failedAttempts": 0, "mfa.lockoutUntil": null } },
    );
  }

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

export const refreshUserAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string; newRefreshToken?: string }> => {
  const { payload, error } = verifyToken<RefreshTokenPayload>(refreshToken, {
    secret: refreshTokenSignOptions.secret,
  });

  appAssert(
    !error && payload?.sessionId,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.InvalidSession,
  );

  const now = new Date();
  const incomingHash = hashToken(refreshToken);
  const GRACE_PERIOD_MS = 15000;
  const graceBoundary = new Date(now.getTime() - GRACE_PERIOD_MS);

  const tryGraceRecovery = async () => {
    const graceSession = await sessionModel
      .findOne({
        _id: payload.sessionId,
        previousRefreshToken: incomingHash,
        tokenRotatedAt: { $gte: graceBoundary },
        expiresAt: { $gt: now },
      })
      .populate({
        path: "userId",
        select: "_id role verified +mfa.lockoutUntil",
      })
      .lean();

    if (graceSession && graceSession.userId) {
      assertNotLocked(graceSession.userId);
      return {
        accessToken: generateAccessToken(graceSession.userId, graceSession._id),
      };
    }
    return null;
  };

  const earlyGraceRecovery = await tryGraceRecovery();
  if (earlyGraceRecovery) return earlyGraceRecovery;

  const candidateRefreshToken = signToken(
    { sessionId: payload.sessionId },
    refreshTokenSignOptions,
  );
  const candidateHash = hashToken(candidateRefreshToken);

  const rotatedSession = await sessionModel
    .findOneAndUpdate(
      {
        _id: payload.sessionId,
        refreshToken: incomingHash,
        expiresAt: { $gt: now },
      },
      {
        $set: {
          refreshToken: candidateHash,
          previousRefreshToken: incomingHash,
          tokenRotatedAt: now,
          expiresAt: sevenDaysFromNow(),
        },
      },
      {
        returnDocument: "after",
        populate: {
          path: "userId",
          select: "_id role verified +mfa.lockoutUntil",
        },
      },
    )
    .lean();

  if (rotatedSession && rotatedSession.userId) {
    assertNotLocked(rotatedSession.userId);
    return {
      accessToken: generateAccessToken(
        rotatedSession.userId,
        rotatedSession._id,
      ),
      newRefreshToken: candidateRefreshToken,
    };
  }

  const lateGraceRecovery = await tryGraceRecovery();
  if (lateGraceRecovery) return lateGraceRecovery;

  const historicalSession = await sessionModel
    .findOne({
      _id: payload.sessionId,
      previousRefreshToken: incomingHash,
    })
    .lean();

  if (historicalSession) {
    await sessionModel.deleteMany({ userId: historicalSession.userId });

    appAssert(
      false,
      UNAUTHORIZED,
      ErrorMessages.InvalidSession,
      AppErrorCode.InvalidSession,
    );
  }

  appAssert(
    false,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.InvalidSession,
  );
};

export const verifyEmail = async (code: string) => {
  const validCode = await consumeVerificationCode(
    code,
    verificationCodeType.EmailVerification,
  );

  const updatedUser = await UserModel.findByIdAndUpdate(
    validCode.userId,
    { $set: { verified: true } },
    { returnDocument: "after" },
  );

  appAssert(
    updatedUser,
    INTERNAL_SERVER_ERROR,
    ErrorMessages.AccountOperationFailed,
    AppErrorCode.VerificationFailed,
  );

  return {
    user: updatedUser.omitPassword(),
  };
};

export const resendVerificationEmail = async (params: UserParams) => {
  const { userId } = params;
  const user = await UserModel.findById(userId);

  appAssert(user, NOT_FOUND, ErrorMessages.NotFound, AppErrorCode.NotFound);

  appAssert(
    !user.verified,
    BAD_REQUEST,
    ErrorMessages.UserVerified,
    AppErrorCode.AlreadyVerified,
  );

  await verificationCodeModel.deleteMany({
    userId,
    type: verificationCodeType.EmailVerification,
  });

  const code = generateUniqueCode();

  await Promise.all([
    verificationCodeModel.create({
      userId,
      code: hashCode(code),
      type: verificationCodeType.EmailVerification,
      expiresAt: fifteenminutesFromNow(),
    }),
    sendMail({
      to: user.email,
      ...getVerifyEmailTemplate(`${CLIENT_URL}/email/verify/${code}`),
    }),
  ]);

  return { user: user.omitPassword() };
};

export const sendPasswordResetEmail = async (params: ForgotPasswordParams) => {
  const { email, userAgent, ip } = params;
  const user = await UserModel.findOne({ email }, "_id email").lean();
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
  const url = `${CLIENT_URL}/password/reset?code=${
    code
  }&exp=${expiresAt.getTime()}`;

  await Promise.all([
    verificationCodeModel.create({
      userId: user._id,
      type: verificationCodeType.PasswordReset,
      code: hashCode(code),
      expiresAt,
    }),
    sendMail({
      to: user.email,
      ...getSecurityAlertTemplate({
        email: user.email,
        title: "Password Reset Requested",
        action: "A password reset was requested for your account",
        resetPasswordUrl: url,
        ip,
        userAgent,
      }),
    }),
  ]);

  return { url };
};

export const resetPassword = async (params: ResetPasswordParams) => {
  const { password, verificationCode, userAgent, ip } = params;
  const validCode = await consumeVerificationCode(
    verificationCode,
    verificationCodeType.PasswordReset,
  );
  const user = await UserModel.findById(validCode.userId).select("+password");

  appAssert(
    user,
    NOT_FOUND,
    ErrorMessages.InvalidOrExpiredToken,
    AppErrorCode.VerificationFailed,
  );
  user.password = password;
  await user.save();

  await Promise.all([
    sessionModel.deleteMany({ userId: user._id }),
    sendMail({
      to: user.email,
      ...getSecurityAlertTemplate({
        email: user.email,
        title: "Password Changed",
        action: "Your account password was successfully changed",
        ip,
        userAgent,
      }),
    }),
  ]);

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

  await Promise.all([
    sessionModel.deleteMany({ userId }),
    verificationCodeModel.deleteMany({ userId }),
  ]);

  return deletedUser.omitPassword();
};
