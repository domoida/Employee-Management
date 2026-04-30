const logger = (req, res, next) => {
  const start = Date.now();
  const safe  = { ...req.body };
  if (safe.password) safe.password = '***';

  console.log(`[${new Date().toISOString()}] --> ${req.method} ${req.originalUrl}`);
  if (Object.keys(safe).length > 0) console.log(`[BODY] ${JSON.stringify(safe)}`);

  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] <-- ${req.method} ${req.originalUrl} ${res.statusCode} (${ms}ms)`);
  });
  next();
};

module.exports = logger;