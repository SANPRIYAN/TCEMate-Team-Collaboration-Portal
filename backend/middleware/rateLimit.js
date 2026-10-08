const createRateLimit = ({ limit, windowMs, key = (req) => req.ip }) => {
  const requests = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [id, record] of requests) {
      if (record.expiresAt <= now) requests.delete(id);
    }
  }, windowMs);
  cleanup.unref();

  return (req, res, next) => {
    const now = Date.now();
    const id = String(key(req) || 'unknown');
    const current = requests.get(id);
    if (!current || current.expiresAt <= now) {
      requests.set(id, { count: 1, expiresAt: now + windowMs });
      return next();
    }
    current.count += 1;
    if (current.count > limit) {
      res.set('Retry-After', String(Math.ceil((current.expiresAt - now) / 1000)));
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    }
    return next();
  };
};

module.exports = { createRateLimit };
