import { Router } from "express";
import { deleteSessionHandler, getSessionHandler } from "./session.controller";
import {
  deleteSessionLimiter,
  limiter,
} from "../../../shared/middleware/rateLimiter";
import authorize from "../../../shared/middleware/authorize";
import Permission from "../../../constants/enums/permissions";
import { csrfProtection } from "../../../shared/middleware/csrf";

const sessionRoutes = Router();

sessionRoutes.get(
  "/",
  authorize(Permission.SESSION_READ_SELF),
  limiter,
  getSessionHandler,
);
sessionRoutes.delete(
  "/:id",
  csrfProtection,
  authorize(Permission.SESSION_DELETE_SELF),
  deleteSessionLimiter,
  deleteSessionHandler,
);
export default sessionRoutes;
