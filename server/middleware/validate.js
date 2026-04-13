const { modelDefinitions } = require('../models');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (modelName) => (req, res, next) => {
  const def = modelDefinitions[modelName];
  if (!def) return next();

  const errors = [];
  const body = req.body;

  for (const [field, opts] of Object.entries(def.fields)) {
    const value = body[field];

    // Required check
    if (opts.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required.`);
      continue;
    }

    if (value === undefined || value === '') continue;

    // Type checks
    if (opts.type === 'email' && !emailRegex.test(value)) {
      errors.push(`${field} must be a valid email address.`);
    }
    if (opts.type === 'number' && isNaN(Number(value))) {
      errors.push(`${field} must be a number.`);
    }
    if (opts.type === 'date' && isNaN(Date.parse(value))) {
      errors.push(`${field} must be a valid date.`);
    }
    if ((opts.type === 'string' || opts.type === 'email') && typeof value === 'string' && value.trim().length < 1) {
      errors.push(`${field} cannot be empty.`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = validate;
