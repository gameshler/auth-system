import { Router } from "express";
import { getUserHandler } from "./user.controller";
import { limiter } from "../../shared/middleware/rateLimiter";
import authorize from "../../shared/middleware/authorize";
import Permission from "../../constants/enums/permissions";

const userRoutes = Router();
userRoutes.get(
  "/",
  authorize(Permission.USER_READ_SELF),
  limiter,
  getUserHandler,
);
export default userRoutes;
