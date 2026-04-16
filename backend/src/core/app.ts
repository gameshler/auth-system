import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { CLIENT_URL, NODE_ENV } from "../constants/env";
import cookieParser from "cookie-parser";
import errorHandler from "../shared/middleware/errorHandler";
import path from "path";
import cors from "cors";
import routes from "../routes";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());
app.use("/api/v1", routes);

if (NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend", "dist", "index.html"));
  });
}
app.use(errorHandler);

export default app;
