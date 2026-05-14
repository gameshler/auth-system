import { Router } from "express";
import {
  deleteLimiter,
  loginLimiter,
  passwordResetLimiter,
  refreshLimiter,
  registerLimiter,
  verifyCodeLimiter,
} from "../../shared/middleware/rateLimiter";
import {
  deleteAccountHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler,
  resendVerificationEmailHandler,
  resetPasswordHandler,
  sendPasswordResetHandler,
  verifyEmailHandler,
} from "./auth.controller";
import authenticate from "../../shared/middleware/authenticate";
import authorize from "../../shared/middleware/authorize";
import Permission from "../../constants/enums/permissions";
import mfaRoutes from "./mfa/mfa.route";
import sessionRoutes from "./session/session.route";
import { csrfProtection } from "../../shared/middleware/csrf";

const authRoutes = Router();

// Auth

authRoutes.post("/register", registerLimiter, registerHandler);
authRoutes.post("/login", loginLimiter, loginHandler);
authRoutes.post("/logout", logoutHandler);
authRoutes.post("/refresh", refreshLimiter, refreshHandler);
authRoutes.use("/2fa", mfaRoutes);
authRoutes.use("/sessions", authenticate, sessionRoutes);

// Email

authRoutes.post(
  "/email/verify",
  authenticate,
  csrfProtection,
  authorize(Permission.USER_VERIFY_SELF),
  verifyCodeLimiter,
  resendVerificationEmailHandler,
);
authRoutes.get("/email/verify/:code", verifyCodeLimiter, verifyEmailHandler);

// Password

authRoutes.post(
  "/password/forgot",
  passwordResetLimiter,
  sendPasswordResetHandler,
);
authRoutes.post("/password/reset", passwordResetLimiter, resetPasswordHandler);

authRoutes.delete(
  "/delete-account",
  authenticate,
  csrfProtection,
  authorize(Permission.ACCOUNT_DELETE_SELF),
  deleteLimiter,
  deleteAccountHandler,
);

export default authRoutes;
