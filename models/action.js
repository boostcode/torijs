var mongoose = require('mongoose');
var schema = mongoose.Schema;

var action = new schema({
  name: String,
  collectionName: String,
  field: String,
  action: String,
  receiver: String,
  trigger: String,
  filter: String,
  from: String,
  to: String,
  message: Array
});

module.exports = mongoose.model('action', action);
