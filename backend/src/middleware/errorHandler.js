export function errorHandler(err, req, res, next) {
  console.error('[backend] Error:', err.message);
  if (err.stack) console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'An unexpected error occurred',
    },
  });
}
