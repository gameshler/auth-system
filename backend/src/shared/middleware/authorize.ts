import { NextFunction, Request, Response } from "express";
import Permission from "../../constants/enums/permissions";
import { rolePermissions } from "../../constants/rolePermissions";
import { FORBIDDEN, UNAUTHORIZED } from "../../constants/http";
import appAssert from "../utils/appAssert";

const authorize =
  (...requiredPermissions: Permission[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    appAssert(req.userId, UNAUTHORIZED, "Unauthorized");
    appAssert(req.role, UNAUTHORIZED, "Unauthorized");

    const userPermissions = rolePermissions[req.role] || [];
    appAssert(userPermissions, FORBIDDEN, "Unauthorized");

    const allowed = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    appAssert(allowed, FORBIDDEN, "Forbidden");

    next();
  };

export default authorize;
