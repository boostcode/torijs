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
  if (req.user.isAdmin == true) {
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

  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Create
router.post('/', function(req, res) {
  if (req.user.isAdmin == true) {
    // sanitize input
    var sanitized = _.pick(req.body, ['name', 'permissions']);

    // create the new role
    var newRole = new role({
      name: sanitized.name
    });

    // manage permissions
    setPermissions(res, newRole, sanitized.permissions, 'Role created.');

  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Update
router.put('/:id', function(req, res) {
  if (req.user.isAdmin == true) {
    // convert id from string to objectId
    var id = mongoose.Types.ObjectId(req.params.id);
    // sanitize input
    var sanitized = _.pick(req.body, ['name', 'permissions']);
    // retrieve the role
    role.findById(id).exec()
      .then(function(found) {
        if (found) {
          // update name
          found.name = sanitized.name;
          // manage permissions
          setPermissions(res, newRole, sanitized.permissions, 'Role updated.');
        } else {
          return error(res, 401, 'Role not found.');
        }
      })
      .catch(function(err) {
        return error(res, 500, err.message);
      });

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
  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Functions
//
function setPermissions(res, newRole, permissions, message) {

  // check if we have permission
  if (permissions == null) {
    return error(res, 404, 'Missing permissions.');
  }

  // get permissions list
  var permList = Array();
  permissions.forEach(function(perm) {
    permList.push(new oID.createFromHexString(perm.pid));
  });

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
      newRole.save().exec()
        .then(function(therole) {
          res.json({
            success: true,
            message: message
          });
        })
        .catch(function(err) {
          return error(res, 500, err.message);
        });
    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });
}

module.exports = router;
