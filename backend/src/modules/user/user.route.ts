import { Router } from "express";
import { getUserHandler } from "./user.controller";
import { limiter } from "../../shared/middleware/rateLimiter";

const userRoutes = Router();
userRoutes.get("/", limiter, getUserHandler);
export default userRoutes;
