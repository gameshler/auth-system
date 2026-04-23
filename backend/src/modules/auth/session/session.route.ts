import { Router } from "express";
import { deleteSessionHandler, getSessionHandler } from "./session.controller";
import {
  deleteSessionLimiter,
  limiter,
} from "../../../shared/middleware/rateLimiter";

const sessionRoutes = Router();

sessionRoutes.get("/", limiter, getSessionHandler);
sessionRoutes.delete("/:id", deleteSessionLimiter, deleteSessionHandler);
export default sessionRoutes;
