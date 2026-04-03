/**
 * rateLimiter.js — lightweight in-process rate limiter.
 * Uses a Map so it works without Redis in development.
 * For production at scale, replace with express-rate-limit + Redis store.
 */

const store = new Map(); // ip → { count, resetAt }

/**
 * createLimiter({ windowMs, max, message })
 *   windowMs  — sliding window in ms (default 15 min)
 *   max       — max requests per window (default 100)
 *   message   — error text on 429
 */
const createLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later.',
} = {}) => {
  return (req, res, next) => {
    const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    const entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    next();
  };
};

// Pre-configured limiters
const authLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many login attempts. Try again in 15 minutes.' });
const apiLimiter  = createLimiter({ windowMs: 60 * 1000,        max: 120, message: 'Request rate exceeded.' });
const strictLimiter = createLimiter({ windowMs: 60 * 1000,      max: 10,  message: 'Action rate limited. Slow down.' });

// Cleanup stale entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (now > val.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

module.exports = { createLimiter, authLimiter, apiLimiter, strictLimiter };
