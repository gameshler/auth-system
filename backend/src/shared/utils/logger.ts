import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import path from "path";
import { NODE_ENV } from "../../constants/env";

const isProd = NODE_ENV === "production";

const logFormat = format.combine(
  format.timestamp(),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

export const logger = createLogger({
  level: isProd ? "info" : "debug",
  format: logFormat,
  transports: [
    new transports.Console({
      format: isProd
        ? format.json()
        : format.combine(format.colorize(), format.simple()),
    }),
    new transports.DailyRotateFile({
      dirname: path.resolve("logs"),
      filename: "%DATE%-app.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      zippedArchive: true,
    }),
  ],
  exitOnError: false,
});
