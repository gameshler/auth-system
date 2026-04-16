import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import appAssert from "../utils/appAssert";
import { TOO_MANY_REQUESTS } from "../../constants/http";

const limiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    appAssert(
      false,
      TOO_MANY_REQUESTS,
      "Too many attempts,please try again later"
    );
  },
});

export default limiter;
