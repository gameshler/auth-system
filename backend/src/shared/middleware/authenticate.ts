import { RequestHandler } from "express";
import appAssert from "../utils/appAssert";
import { UNAUTHORIZED } from "../../constants/http";
import AppErrorCode from "../../constants/enums/AppErrorCode";
import { verifyToken } from "../utils/jwt";
import { ErrorMessages } from "../utils/errorMessages";

const authenticate: RequestHandler = (req, res, next) => {
  const accessToken = req.cookies.accessToken;
  appAssert(
    accessToken,
    UNAUTHORIZED,
    ErrorMessages.Unauthorized,
    AppErrorCode.InvalidToken,
  );

  const { error, payload } = verifyToken(accessToken);
  appAssert(
    payload,
    UNAUTHORIZED,
    error === "jwt expired"
      ? ErrorMessages.InvalidSession
      : ErrorMessages.InvalidSession,
    AppErrorCode.InvalidToken,
  );
  req.userId = payload.userId;
  req.sessionId = payload.sessionId;
  req.role = payload.role;
  req.verified = payload.verified;
  next();
};

export default authenticate;
