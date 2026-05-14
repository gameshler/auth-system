import AppErrorCode from "../../constants/enums/AppErrorCode";
import {
  CREATED,
  INTERNAL_SERVER_ERROR,
  OK,
  UNAUTHORIZED,
} from "../../constants/http";
import {
  clearAllAuthAndCsrfCookies,
  setAuthCookiesAndCsrf,
} from "../../shared/middleware/csrf";
import sessionModel from "../../shared/models/session";
import appAssert from "../../shared/utils/appAssert";
import catchErrors from "../../shared/utils/catchErrors";
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../../shared/utils/cookies";
import { ErrorMessages } from "../../shared/utils/errorMessages";
import { verifyToken } from "../../shared/utils/jwt";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verificationCodeSchema,
} from "./auth.schemas";
import {
  createAccount,
  deleteUserAccount,
  loginUser,
  refreshUserAccessToken,
  resendVerificationEmail,
  resetPassword,
  sendPasswordResetEmail,
  verifyEmail,
} from "./auth.service";

export const registerHandler = catchErrors(async (req, res) => {
  const request = registerSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  const { user, accessToken, refreshToken } = await createAccount(request);

  const csrfToken = setAuthCookiesAndCsrf(req, res, accessToken, refreshToken);
  return res.status(CREATED).json({ user, csrfToken });
});

export const loginHandler = catchErrors(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  const result = await loginUser(request);
  if (result.mfaRequired) {
    return res.status(OK).json({
      mfaRequired: true,
      challengeId: result.challengeId,
      message: result.message,
    });
  }
  const csrfToken = setAuthCookiesAndCsrf(
    req,
    res,
    result.accessToken,
    result.refreshToken,
  );

  return res.status(OK).json({ message: "Login successful", csrfToken });
});

export const logoutHandler = catchErrors(async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const { payload } = verifyToken(accessToken);

  if (payload?.sessionId) {
    await sessionModel.deleteOne({ _id: payload.sessionId });
  }

  clearAllAuthAndCsrfCookies(res);
  return res.status(OK).json({ message: "Logout successful" });
});

export const refreshHandler = catchErrors(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  appAssert(
    refreshToken,
    UNAUTHORIZED,
    ErrorMessages.InvalidSession,
    AppErrorCode.InvalidSession,
  );
  const { accessToken, newRefreshToken } =
    await refreshUserAccessToken(refreshToken);
  res.cookie("accessToken", accessToken, getAccessTokenCookieOptions());
  if (newRefreshToken) {
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
  }
  return res.status(OK).json({
    message: "Access Token Refreshed",
  });
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  await verifyEmail(verificationCode);

  return res.status(OK).json({ message: "Email was successfully verified" });
});

export const resendVerificationEmailHandler = catchErrors(async (req, res) => {
  const userId = req.userId;

  const email = await resendVerificationEmail({ userId });
  appAssert(
    email,
    INTERNAL_SERVER_ERROR,
    ErrorMessages.AccountOperationFailed,
    AppErrorCode.ServerError,
  );

  return res.status(OK).json({
    message: "Verification email sent successfully",
  });
});

export const sendPasswordResetHandler = catchErrors(async (req, res) => {
  const request = forgotPasswordSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  await sendPasswordResetEmail(request);
  return res.status(OK).json({ message: "Password reset email sent" });
});

export const resetPasswordHandler = catchErrors(async (req, res) => {
  const request = resetPasswordSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  await resetPassword(request);
  clearAllAuthAndCsrfCookies(res);
  return res
    .status(OK)
    .json({ message: "Password reset successful. Please login again." });
});

export const deleteAccountHandler = catchErrors(async (req, res) => {
  const userId = req.userId;

  const deletedUser = await deleteUserAccount({ userId });
  appAssert(
    deletedUser,
    INTERNAL_SERVER_ERROR,
    ErrorMessages.AccountOperationFailed,
    AppErrorCode.ServerError,
  );
  clearAllAuthAndCsrfCookies(res);
  return res.status(OK).json({ message: "Account deleted successfully" });
});
