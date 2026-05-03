import { Router } from "express";
import authRoutes from "../modules/auth/auth.route";
import authenticate from "../shared/middleware/authenticate";
import userRoutes from "../modules/user/user.route";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/user", authenticate, userRoutes);

export default routes;
