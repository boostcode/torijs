var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var oID = require('mongodb').ObjectID;
var _ = require('underscore');
var error = require('../error');

/// List
router.get('/', function(req, res) {
  if (req.user.isAdmin == true) {
    role.find({}, function(err, roles) {
      if (err) {
        return error(res, 500, err.message);
      }
      res.json({
        success: true,
        role: roles
      })
    });
  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Create
router.post('/', function(req, res) {
  if (req.user.isAdmin == true) {} else {
    return error(res, 403, 'User has no permission');
  }
});

/// Update
router.put('/:id', function(req, res) {
  if (req.user.isAdmin == true) {
    // convert id from string to objectId
    var id = mongoose.Types.ObjectId(req.params.id);

  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Remove
router.delete('/:id', function(req, res) {
  if (req.user.isAdmin == true) {
    // convert id from string to objectId
    var id = mongoose.Types.ObjectId(req.params.id);
    // find requested action
    role.findByIdAndRemove(id, function(err, action) {
      if (err) {
        return error(res, 500, err.message);
      }

      res.json({
        success: true,
        message: 'Role removed.'
      });
    });
  } else {
    return error(res, 403, 'User has no permission');
  }
});
