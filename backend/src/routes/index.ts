import { Router } from "express";
import authRoutes from "../modules/auth/auth.route";
import authenticate from "../shared/middleware/authenticate";
import userRoutes from "../modules/user/user.route";
import { getCsrfTokenHandler } from "../shared/middleware/csrf";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/user", authenticate, userRoutes);
routes.get("/csrf-token", getCsrfTokenHandler);

export default routes;
