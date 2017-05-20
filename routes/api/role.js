var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var oID = require('mongodb').ObjectID;
var _ = require('underscore');
var error = require('../error');

/// List
router.get('/', function(req, res) {
  role.find({}).exec()
    .then(function(roles) {
      res.json({
        success: true,
        role: roles
      });
    })
    .catch(function(err) {
      return error(res, 500, res.message);
    });
});

/// Create
router.post('/', function(req, res) {
  // sanitize input
  var sanitized = _.pick(req.body, ['name', 'permissions']);

  // create the new role
  var newRole = new role({
    name: sanitized.name
  });

  // manage permissions
  setPermissions(res, newRole, sanitized.permissions, 'Role created.');

});

/// Update
router.put('/:id', function(req, res) {
  // convert id from string to objectId
  var id = mongoose.Types.ObjectId(req.params.id);
  // sanitize input
  var sanitized = _.pick(req.body, ['name', 'permissions']);
  // retrieve the role
  role.findById(id).exec()
    .then(function(found) {
      // update name
      found.name = sanitized.name;
      // manage permissions
      setPermissions(res, newRole, sanitized.permissions, 'Role updated.');
    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });

});

/// Remove
router.delete('/:id', function(req, res) {
  // convert id from string to objectId
  var id = mongoose.Types.ObjectId(req.params.id);
  // find requested role
  role.findByIdAndRemove(id).exec()
    .then(function(action) {
      res.json({
        success: true,
        message: 'Role removed.'
      });
    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });
});

/// Functions

// extract permission from body
function getPermissions(res, permissions) {
  // check if we have permission
  if (permissions == null) {
    return error(res, 404, 'Missing permissions.');
  }

  // get permissions list
  var permList = Array();
  permissions.forEach(function(perm) {
    permList.push(new oID.createFromHexString(perm.pid));
  });

  return permList;
}

// set permission in data model
function setPermissions(res, newRole, permissions, message) {

  // retrieve permissions
  var permList = getPermissions(res, permissions);

  // create query to check for permissions
  var query = {
    _id: {
      $in: permList
    }
  };

  permission.find(query).exec()
    .then(function(perms) {
      // set permission
      newRole.permissions = perms;
      // save the new role
      return newRole.save();
    })
    .then(function(role) {
      res.json({
        success: true,
        message: message
      });
    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });
}

module.exports = router;
