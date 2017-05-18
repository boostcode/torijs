var mongoose = require('mongoose');
var schema = mongoose.Schema;

var structure = new schema({
  label: String,
  order: String,
  type: String,
  fieldname: String
});

module.exports = mongoose.model('structure', structure);
