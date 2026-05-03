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
  resetPasswordHandler,
  sendPasswordResetHandler,
  verifyEmailHandler,
} from "./auth.controller";
import authenticate from "../../shared/middleware/authenticate";
import authorize from "../../shared/middleware/authorize";
import Permission from "../../constants/enums/permissions";
import mfaRoutes from "./mfa/mfa.route";
import sessionRoutes from "./session/session.route";

const authRoutes = Router();

authRoutes.post("/register", registerLimiter, registerHandler);
authRoutes.post("/login", loginLimiter, loginHandler);
authRoutes.post("/refresh", refreshLimiter, refreshHandler);
authRoutes.post("/logout", authenticate, logoutHandler);
authRoutes.get("/email/verify/:code", verifyCodeLimiter, verifyEmailHandler);
authRoutes.post(
  "/password/forgot",
  passwordResetLimiter,
  sendPasswordResetHandler,
);
authRoutes.post("/password/reset", passwordResetLimiter, resetPasswordHandler);
authRoutes.delete(
  "/delete-account",
  authenticate,
  authorize(Permission.ACCOUNT_DELETE_SELF),
  deleteLimiter,
  deleteAccountHandler,
);

authRoutes.use("/2fa", mfaRoutes);
authRoutes.use("/sessions", authenticate, sessionRoutes);

export default authRoutes;
