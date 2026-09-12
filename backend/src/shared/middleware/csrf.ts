import { doubleCsrf } from "csrf-csrf";
import { Request, Response, NextFunction } from "express";
import catchErrors from "../utils/catchErrors";
import { OK, FORBIDDEN } from "../../constants/http";
import { CSRF_SECRET, NODE_ENV } from "../../constants/env";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies";
import appAssert from "../utils/appAssert";
import { ErrorMessages } from "../utils/errorMessages";
import AppErrorCode from "../../constants/enums/AppErrorCode";
import { hashSecret } from "../utils/crypto";

const csrfCookieName =
  NODE_ENV === "production" ? "__Host-ps-csrf-token" : "ps-csrf-token";

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => CSRF_SECRET,
  getSessionIdentifier: (req: Request) => {
    const refreshToken = req.cookies.refreshToken || "";
    return hashSecret(refreshToken);
  },
  cookieName: csrfCookieName,
  cookieOptions: {
    httpOnly: true,
    secure: NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"],
});

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  doubleCsrfProtection(req, res, (err) => {
    if (!err) {
      return next();
    }

    appAssert(
      false,
      FORBIDDEN,
      ErrorMessages.Forbidden,
      AppErrorCode.Forbidden,
    );
  });
};

export const issueCsrfToken = (req: Request, res: Response): string => {
  return generateCsrfToken(req, res, { overwrite: true });
};

export const getCsrfTokenHandler = catchErrors(async (req, res) => {
  const token = issueCsrfToken(req, res);
  return res.status(OK).json({ csrfToken: token });
});

export const setAuthCookiesAndCsrf = (
  req: Request,
  res: Response,
  accessToken: string,
  refreshToken: string,
): string => {
  setAuthCookies({ res, accessToken, refreshToken });
  return issueCsrfToken(req, res);
};

export const clearCsrfCookie = (res: Response) => {
  res.clearCookie(csrfCookieName, { path: "/" });
};

export const clearAllAuthAndCsrfCookies = (res: Response) => {
  clearAuthCookies(res);
  clearCsrfCookie(res);
};
