import AppErrorCode from "../enums/AppErrorCode";
import { HttpStatusCode } from "../http";
import { Request, Response, NextFunction } from "express";
import { sessionDocument, UserDocument } from "../interfaces/model.interface";
import { SignOptions } from "jsonwebtoken";

export type AppAssert = (
  condition: any,
  HttpStatusCode: HttpStatusCode,
  message: string,
  appErrorCode?: AppErrorCode
) => asserts condition;

export type AsyncController = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export type Params = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export type RefreshTokenPayload = {
  sessionId: sessionDocument["_id"];
};

export type AccessTokenPayload = {
  userId: UserDocument["_id"];
  sessionId: sessionDocument["_id"];
};

export type SignOptionsAndSecret = SignOptions & {
  secret: string;
};

export type MailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};
