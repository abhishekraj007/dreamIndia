import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  uploadUrlMint: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 5,
  },
  adminUploadUrlMint: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 10,
  },
  transformPerUser: {
    kind: "token bucket",
    rate: 10,
    period: HOUR,
    capacity: 10,
  },
  transformPerIp: {
    kind: "fixed window",
    rate: 30,
    period: HOUR,
  },
});
