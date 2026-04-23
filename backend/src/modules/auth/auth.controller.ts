import {
  CREATED,
  INTERNAL_SERVER_ERROR,
  OK,
  UNAUTHORIZED,
} from "../../constants/http";
import sessionModel from "../../shared/models/session";
import appAssert from "../../shared/utils/appAssert";
import catchErrors from "../../shared/utils/catchErrors";
import {
  clearAuthCookies,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthCookies,
} from "../../shared/utils/cookies";
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

  return setAuthCookies({ res, accessToken, refreshToken })
    .status(CREATED)
    .json(user);
});

export const loginHandler = catchErrors(async (req, res) => {
  const request = loginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  const { accessToken, refreshToken } = await loginUser(request);

  return setAuthCookies({ res, accessToken, refreshToken })
    .status(OK)
    .json({ message: "Login successful" });
});

export const logoutHandler = catchErrors(async (req, res) => {
  const accessToken = req.cookies.accessToken;
  const { payload } = verifyToken(accessToken);
  if (payload) {
    await sessionModel.findByIdAndDelete(payload.sessionId);
  }
  return clearAuthCookies(res)
    .status(OK)
    .json({ message: "Logout successful" });
});

export const refreshHandler = catchErrors(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  appAssert(refreshToken, UNAUTHORIZED, "Missing refresh token");
  const { accessToken, newRefreshToken } =
    await refreshUserAccessToken(refreshToken);
  if (newRefreshToken) {
    res.cookie("refreshToken", newRefreshToken, getRefreshTokenCookieOptions());
  }
  return res
    .status(OK)
    .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
    .json({
      message: "Access Token Refreshed",
    });
});

export const verifyEmailHandler = catchErrors(async (req, res) => {
  const verificationCode = verificationCodeSchema.parse(req.params.code);

  await verifyEmail(verificationCode);

  return res.status(OK).json({ message: "Email was successfully verified" });
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
  return clearAuthCookies(res)
    .status(OK)
    .json({ message: "Password reset Successful" });
});

export const deleteAccountHandler = catchErrors(async (req, res) => {
  const userId = String(req.userId);

  const deletedUser = await deleteUserAccount(userId);
  appAssert(deletedUser, INTERNAL_SERVER_ERROR, "Failed to delete user");
  return clearAuthCookies(res).status(OK).json({
    message: "Account deleted successfully",
    user: deletedUser,
  });
});
