import rateLimit, {
  ipKeyGenerator,
  RateLimitRequestHandler,
} from "express-rate-limit";
import appAssert from "../utils/appAssert";
import { TOO_MANY_REQUESTS } from "../../constants/http";

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
};

export const limiter: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 30,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many attempts,please try again later",
    );
  },
});

export const loginLimiter: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 5,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many login attempts, please try again later",
    );
  },
  keyGenerator: (req) => {
    const email = req.body.email || "unknown";
    const ip = ipKeyGenerator(req.ip || "unknown");
    return `${ip}-${email}`;
  },
});

export const registerLimiter: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many registration attempts, please try again later",
    );
  },
});

export const passwordResetLimiter: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 30 * 60 * 1000, // 30 min
  limit: 3,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many password reset requests, please try again later",
    );
  },
});

export const refreshLimiter: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 3,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many refresh requests, please try again later",
    );
  },
});

export const verifyCodeLimiter: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 3,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many email verification code requests, please try again later",
    );
  },
});

export const deleteLimiter: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 60 min
  limit: 2,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many delete requests, please try again later",
    );
  },
});

export const deleteSessionLimiter: RateLimitRequestHandler = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000, // 60 min
  limit: 8,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many delete requests, please try again later",
    );
  },
});
