/**
 * Global Express error handler.
 * Must be registered last: app.use(errorHandler)
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  const response = {
    success: false,
    message,
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Async wrapper to avoid try/catch in every route handler.
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
