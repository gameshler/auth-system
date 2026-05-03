import rateLimit, {
  ipKeyGenerator,
  RateLimitRequestHandler,
} from "express-rate-limit";
import appAssert from "../utils/appAssert";
import { TOO_MANY_REQUESTS } from "../../constants/http";
import { ErrorMessages } from "../utils/errorMessages";
import AppErrorCode from "../../constants/enums/AppErrorCode";
import { Request, Response } from "express";

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      ErrorMessages.TooManyRequests,
      AppErrorCode.TooManyRequests,
    );
  },
};

export const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 30,
  ...baseConfig,
});

export const loginLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 5,
  ...baseConfig,
  keyGenerator: (req) => {
    const email = req.body.email;
    const ip = ipKeyGenerator(req.ip || "unknown");
    return `${ip}-${email}`;
  },
});

export const registerLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  ...baseConfig,
});

export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 min
  limit: 1,
  ...baseConfig,
});

export const refreshLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 3,
  ...baseConfig,
});

export const verifyCodeLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 3,
  ...baseConfig,
});

export const mfaLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 3,
  ...baseConfig,
  keyGenerator: (req) => {
    const challengeId = req.body.challengeId;
    const ip = ipKeyGenerator(req.ip || "");
    return `${ip}-${challengeId}`;
  },
});

export const deleteLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  limit: 2,
  ...baseConfig,
});

export const deleteSessionLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 min
  limit: 8,
  ...baseConfig,
});
