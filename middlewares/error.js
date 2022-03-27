const { StatusCodes } = require('http-status-codes');

module.exports = (err, _req, res, _next) => {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: `Internal server error: ${err.message}` });
};
