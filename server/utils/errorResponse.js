class ErrorResponse extends Error {
  /**
   * Create a new ErrorResponse instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {Object} errors - Additional error details (optional)
   */
  constructor(message, statusCode, errors = {}) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    
    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  // Static method to create a bad request error
  static badRequest(message = 'Bad Request', errors = {}) {
    return new ErrorResponse(message, 400, errors);
  }

  // Static method to create an unauthorized error
  static unauthorized(message = 'Unauthorized', errors = {}) {
    return new ErrorResponse(message, 401, errors);
  }

  // Static method to create a forbidden error
  static forbidden(message = 'Forbidden', errors = {}) {
    return new ErrorResponse(message, 403, errors);
  }

  // Static method to create a not found error
  static notFound(message = 'Resource not found', errors = {}) {
    return new ErrorResponse(message, 404, errors);
  }

  // Static method to create a validation error
  static validationError(message = 'Validation Error', errors = {}) {
    return new ErrorResponse(message, 422, errors);
  }

  // Static method to create a server error
  static serverError(message = 'Internal Server Error', errors = {}) {
    return new ErrorResponse(message, 500, errors);
  }

  // Static method to create a service unavailable error
  static serviceUnavailable(message = 'Service Unavailable', errors = {}) {
    return new ErrorResponse(message, 503, errors);
  }

  // Method to format error for response
  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors || undefined,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined
    };
  }
}

// Global error handler middleware
const errorHandler = (err, _req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log to console for development
  console.error(err.stack);

  // Handle specific error types
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}. Please use another value.`;
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = 'Validation failed';
    const errors = {};
    
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    
    error = new ErrorResponse(message, 400, errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token has expired';
    error = new ErrorResponse(message, 401);
  }

  // Default to 500 Internal Server Error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.message = error.message || 'Internal Server Error';
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    error: error.message || 'Server Error',
    errors: error.errors || undefined,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};

// Async error handler wrapper (for async/await error handling)
const asyncHandler = (fn) => (req, res, next) => {
  return Promise
    .resolve(fn(req, res, next))
    .catch(next);
};

module.exports = { ErrorResponse, errorHandler, asyncHandler };