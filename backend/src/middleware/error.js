const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  console.error('Error:', err.message);
  if (err.name === 'CastError') {
    error = { statusCode: 400, message: 'Invalid ID format' };
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = { statusCode: 400, message: `${field} already exists` };
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    error = { statusCode: 400, message: messages.join(', ') };
  }
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
  });
};
module.exports = errorHandler;
