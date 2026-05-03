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
  clearAuthCookies,
  setAuthCookies,
} from "../../../shared/utils/cookies";

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

  return setAuthCookies({ res, accessToken, refreshToken }).status(OK).json({
    message: "Login successful",
    user,
  });
});

export const disableMfaHandler = catchErrors(async (req, res) => {
  const userId = req.userId;
  const { password } = mfaSchema.parse(req.body);
  await disableMfa({ userId, password });

  return clearAuthCookies(res).status(OK).json({
    message: "MFA disabled Please log in again.",
  });
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
