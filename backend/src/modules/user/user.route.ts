import { Router } from "express";
import { getUserHandler } from "./user.controller";

const userRoutes = Router();
userRoutes.get("/", getUserHandler);
export default userRoutes;
