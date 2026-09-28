// middleware/rateLimit.js
//
// Minimal in-memory rate limiter — deliberately dependency-free so it
// works without an `npm install` step. Good enough for a single backend
// instance; if you ever scale to multiple server processes, the counters
// won't be shared between them, so swap this for `express-rate-limit`
// backed by Redis (or similar) at that point.

const buckets = new Map(); // "ip:route" -> { count, resetAt }

function rateLimit({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = "Too many requests, please try again later.",
} = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json({ error: message });
    }

    bucket.count += 1;
    next();
  };
}

// Periodic sweep so the Map doesn't grow forever on a long-running process.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

module.exports = rateLimit;
