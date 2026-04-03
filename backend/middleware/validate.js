/**
 * validate.js — Express middleware helpers for input validation & sanitization.
 * Uses plain JS — no extra dependencies required.
 */

const validator = {
  // Trim + strip HTML tags from all string fields in req.body
  sanitizeBody: (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const clean = (obj) => {
        for (const key of Object.keys(obj)) {
          if (typeof obj[key] === 'string') {
            // Trim whitespace
            obj[key] = obj[key].trim();
            // Strip script tags and common XSS vectors
            obj[key] = obj[key]
              .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
          } else if (obj[key] && typeof obj[key] === 'object') {
            clean(obj[key]);
          }
        }
      };
      clean(req.body);
    }
    next();
  },

  // Validate MongoDB ObjectId param
  validateObjectId: (paramName = 'id') => (req, res, next) => {
    const val = req.params[paramName];
    if (!val || !/^[a-f\d]{24}$/i.test(val)) {
      return res.status(400).json({ success: false, message: `Invalid ${paramName} format.` });
    }
    next();
  },

  // Require specific fields in req.body
  requireFields: (...fields) => (req, res, next) => {
    const missing = fields.filter(f => {
      const val = req.body[f];
      return val === undefined || val === null || val === '';
    });
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    next();
  },

  // Enforce max field lengths
  maxLength: (limits = {}) => (req, res, next) => {
    for (const [field, max] of Object.entries(limits)) {
      const val = req.body[field];
      if (val && typeof val === 'string' && val.length > max) {
        return res.status(400).json({
          success: false,
          message: `Field '${field}' exceeds maximum length of ${max} characters.`,
        });
      }
    }
    next();
  },

  // Check that page/limit query params are valid integers
  paginationGuard: (req, res, next) => {
    const page  = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    if (req.query.page  !== undefined && (isNaN(page)  || page  < 1))  return res.status(400).json({ message: 'Invalid page param.'  });
    if (req.query.limit !== undefined && (isNaN(limit) || limit < 1 || limit > 200)) return res.status(400).json({ message: 'Invalid limit param.' });
    next();
  },
};

module.exports = validator;
