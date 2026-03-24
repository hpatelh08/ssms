// =============================================
//  ERROR HANDLER MIDDLEWARE
// =============================================
function errorHandler(err, req, res, _next) {
  console.error('❌ Error:', err.message || err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = errorHandler;
