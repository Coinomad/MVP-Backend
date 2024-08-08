
// src/middlewares/errorMiddleware.js
const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

// Combine both middlewares into a single export
module.exports = {
  errorMiddleware,
};
