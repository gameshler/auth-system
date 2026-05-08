import { Router } from "express";
import authenticate from "../../../shared/middleware/authenticate";
import {
  disableMfaHandler,
  generateMfaSetupHandler,
  regenerateBackupCodesHandler,
  verifyMfaLoginHandler,
  verifyMfaSetupHandler,
} from "./mfa.controller";
import { mfaLimiter } from "../../../shared/middleware/rateLimiter";
import authorize from "../../../shared/middleware/authorize";
import Permission from "../../../constants/enums/permissions";
import { csrfProtection } from "../../../shared/middleware/csrf";

const mfaRoutes = Router();

mfaRoutes.get(
  "/setup",
  authenticate,
  authorize(Permission.MFA_SETUP_SELF),
  mfaLimiter,
  generateMfaSetupHandler,
);
mfaRoutes.post(
  "/verify-setup",
  authenticate,
  csrfProtection,
  authorize(Permission.MFA_SETUP_SELF),
  mfaLimiter,
  verifyMfaSetupHandler,
);
mfaRoutes.delete(
  "/disable",
  authenticate,
  csrfProtection,
  authorize(Permission.MFA_DISABLE_SELF),
  mfaLimiter,
  disableMfaHandler,
);
mfaRoutes.post(
  "/backup-codes",
  authenticate,
  csrfProtection,
  authorize(Permission.MFA_MANAGE_BACKUP_CODES_SELF),
  mfaLimiter,
  regenerateBackupCodesHandler,
);
mfaRoutes.post("/verify-login", mfaLimiter, verifyMfaLoginHandler);

export default mfaRoutes;
