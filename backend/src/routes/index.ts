import { Router } from "express";
import authRoutes from "../modules/auth/auth.route";
import authenticate from "../shared/middleware/authenticate";
import userRoutes from "../modules/user/user.route";
import sessionRoutes from "../modules/auth/session/session.route";

const routes = Router();

// user routes
routes.use("/auth", authRoutes);
routes.use("/user", authenticate, userRoutes);
routes.use("/sessions", authenticate, sessionRoutes);

export default routes;
