var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var permission = rbac.Permission;
var _ = require('underscore');

/// Error handler
function error(status, message) {
  res.status(status).json({
    success: false,
    message: message
  });
}

/// List
router.get('/list', function(req, res) {
  // FIXME: verify if only admin has to see this
  permission.find({}, function(err, perms) {
    if (err) {
      return error(500, err.message);
    }

    res.json({
      success: true,
      permission: _.groupBy(perms, 'subject')
    });

  });
});

module.exports = router;
