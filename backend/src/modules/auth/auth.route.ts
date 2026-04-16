import { Router } from "express";
import limiter from "../../shared/middleware/rateLimiter";
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

const authRoutes = Router();

authRoutes.post("/register", limiter, registerHandler);
authRoutes.post("/login", limiter, loginHandler);
authRoutes.post("/refresh", refreshHandler);
authRoutes.post("/logout", authenticate, logoutHandler);
authRoutes.get("/email/verify/:code", verifyEmailHandler);
authRoutes.post("/password/forgot", limiter, sendPasswordResetHandler);
authRoutes.post("/password/reset", limiter, resetPasswordHandler);
authRoutes.delete(
  "/delete-account",
  limiter,
  authenticate,
  deleteAccountHandler,
);
export default authRoutes;
