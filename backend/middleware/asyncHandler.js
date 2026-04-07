/**
 * Wraps async route handlers to automatically catch exceptions
 * and pass them to the Express global error handler (next(err)).
 * 
 * Replaces the need for repetitive try/catch blocks in controllers.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
