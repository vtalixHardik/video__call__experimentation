const notFound = (req, res, next) => {
  const error = new Error(`Not found ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  // List of known database error types
  const databaseErrorTypes = [
    "SequelizeDatabaseError",
    "SequelizeValidationError",
    "SequelizeUniqueConstraintError",
    "SequelizeForeignKeyConstraintError",
    "SequelizeConnectionError",
    "SequelizeConnectionRefusedError",
    "SequelizeTimeoutError",
  ];

  const isDatabaseError = databaseErrorTypes.includes(err.name);

  res.json({
    message: isDatabaseError ? "Something went wrong" : err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };