import {
  disableMfa,
  generateMfaSetup,
  regenerateBackupCodes,
  verifyMfaLogin,
  verifyMfaSetup,
} from "./mfa.service";
import catchErrors from "../../../shared/utils/catchErrors";
import { OK } from "../../../constants/http";
import { mfaLoginSchema, mfaSchema, mfaSetupVerifySchema } from "./mfa.schemas";
import {
  clearAllAuthAndCsrfCookies,
  setAuthCookiesAndCsrf,
} from "../../../shared/middleware/csrf";

export const generateMfaSetupHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const result = await generateMfaSetup({ userId });

  return res.status(OK).json(result);
});

export const verifyMfaSetupHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const { code } = mfaSetupVerifySchema.parse(req.body);
  const result = await verifyMfaSetup({ userId, code });

  return res.status(OK).json(result);
});

export const verifyMfaLoginHandler = catchErrors(async (req, res) => {
  const request = mfaLoginSchema.parse({
    ...req.body,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  const { accessToken, refreshToken, user } = await verifyMfaLogin(request);

  const csrfToken = setAuthCookiesAndCsrf(req, res, accessToken, refreshToken);
  return res.status(OK).json({ message: "Login successful", user, csrfToken });
});

export const disableMfaHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const { password } = mfaSchema.parse(req.body);
  await disableMfa({ userId, password });
  clearAllAuthAndCsrfCookies(res);
  return res.status(OK).json({ message: "MFA disabled Please log in again." });
});

export const regenerateBackupCodesHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const { password } = mfaSchema.parse(req.body);
  const { backupCodes } = await regenerateBackupCodes({ userId, password });

  return res.status(OK).json({
    message: "New backup codes generated. Please save these in a safe place.",
    backupCodes,
  });
});
