/// Error handler
module.exports = function error(res, status, message) {
  res.status(status).json({
    success: false,
    message: message
  });
}
