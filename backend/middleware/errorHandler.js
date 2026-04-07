const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err.stack || err);

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    message = "A record with this information already exists.";
    
    // Customize message if it's an email conflict (common in auth)
    if (err.keyValue && err.keyValue.email) {
      message = "Email already registered.";
    }
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  }

  // Optional: Hide actual server errors in production, but we keep it here for simplicity
  // if (process.env.NODE_ENV === 'production' && statusCode === 500) {
  //   message = 'Something went wrong on the server.';
  // }

  res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = errorHandler;
