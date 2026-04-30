const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: false, message: 'Too many requests', error: 'Rate limit exceeded. Try again later.' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { status: false, message: 'Too many requests', error: 'Rate limit exceeded. Try again later.' }
});

module.exports = { authLimiter, apiLimiter };