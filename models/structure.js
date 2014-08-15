var mongoose = require('mongoose');
var schema = mongoose.Schema;

var structure = new schema({
  label: String,
  orddine: String,
  tipo: String,
  fieldname: String
});

module.exports = mongoose.model('structure', structure);
:w
