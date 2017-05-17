var mongoose = require('mongoose');
var schema = mongoose.Schema;
var passportLocal = require('passport-local-mongoose');
var rbac = require('mongoose-rbac');

var account = new schema({
  name: {
    type: String,
    default: ''
  },
  surname: {
    type: String,
    default: ''
  },
  username: String,
  password: String,
  token: String,
  apnstoken: String,
  gcmtoken: String,
  resetPassword: String,
  isAdmin: {
    type: Boolean,
    default: false
  },
  isDev: {
    type: Boolean,
    default: false
  },
  extraFields: schema.Types.Mixed
});

account.plugin(passportLocal);
account.plugin(rbac.plugin);

module.exports = mongoose.model('account', account);
