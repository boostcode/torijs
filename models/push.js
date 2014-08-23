var mongoose = require('mongoose');
var schema = mongoose.Schema;

var push = new schema({
  token: String,
  os: String,
  title: String,
  message: String,
  badge: Number,
  extrafields: Array,
  sent: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('push', push);
