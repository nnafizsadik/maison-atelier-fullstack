/**
 * Simple in-memory rate limiter to prevent OTP abuse.
 * Tracks requests by IP address.
 */

const ipCache = new Map();

// Cleanup cache every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipCache.entries()) {
    if (now > data.resetTime) {
      ipCache.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Factory for creating rate limit middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default 15 mins)
 * @param {number} options.max - Max requests per window (default 5)
 * @param {string} options.message - Error message
 */
export const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 5,
    message = "Too many requests, please try again later."
  } = options;

  return (req, res, next) => {
    // req.ip is safe because server.js sets "trust proxy: 1".
    // DO NOT fall back to req.headers["x-forwarded-for"] — that header
    // is attacker-controlled and can be spoofed to bypass rate limits.
    const ip = req.ip || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipCache.has(ip)) {
      ipCache.set(ip, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }

    const data = ipCache.get(ip);

    if (now > data.resetTime) {
      // Reset window
      data.count = 1;
      data.resetTime = now + windowMs;
      return next();
    }

    data.count++;

    if (data.count > max) {
      console.warn(`[RATE LIMIT] IP ${ip} exceeded limit for ${req.originalUrl}`);
      return res.status(429).json({ error: message });
    }

    next();
  };
};
