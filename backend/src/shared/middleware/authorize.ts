import { NextFunction, Request, Response } from "express";
import Permission from "../../constants/enums/permissions";
import { rolePermissions } from "../../constants/rolePermissions";
import { FORBIDDEN, UNAUTHORIZED } from "../../constants/http";
import appAssert from "../utils/appAssert";
import { ErrorMessages } from "../utils/errorMessages";
import AppErrorCode from "../../constants/enums/AppErrorCode";

const authorize =
  (...requiredPermissions: Permission[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    appAssert(
      req.userId,
      UNAUTHORIZED,
      ErrorMessages.Unauthorized,
      AppErrorCode.Unauthorized,
    );
    appAssert(
      req.role,
      UNAUTHORIZED,
      ErrorMessages.Unauthorized,
      AppErrorCode.Unauthorized,
    );

    const userPermissions = rolePermissions[req.role];
    appAssert(
      userPermissions,
      FORBIDDEN,
      ErrorMessages.Forbidden,
      AppErrorCode.Forbidden,
    );

    const allowed = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    appAssert(
      allowed,
      FORBIDDEN,
      ErrorMessages.Forbidden,
      AppErrorCode.Forbidden,
    );

    next();
  };

export default authorize;
