var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var permission = rbac.Permission;
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var _ = require('underscore');
var error = require('../error');

/// List
router.get('/', function(req, res) {
  // FIXME: verify if only admin has to see this
  permission.find({}).exec()
    .then(function(perms) {
      res.json({
        success: true,
        permission: _.groupBy(perms, 'subject')
      });
    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });
});

module.exports = router;
