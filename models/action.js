var mongoose = require('mongoose');
var schema = mongoose.Schema;

var action = new schema({
  name: String,
  collectionRef: {
    type: mongoose.Schema.Types.ObjectId,
  },
  field: String,
  action: String,
  creatorMail: Boolean,
  editorMail: Boolean,
  receiver: String,
  trigger: String,
  filter: String,
  from: String,
  to: String,
  message: Array
});

module.exports = mongoose.model('action', action);
