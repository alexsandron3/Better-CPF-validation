const { StatusCodes } = require('http-response-status');

module.exports = (err, _req, res) => {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: `Internal server error: ${err.message}` });
};
