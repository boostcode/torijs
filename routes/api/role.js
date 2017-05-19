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
    role.findById(id, function(err, found) {
      if (err) {
        return error(res, 500, err.message);
      }
      if (found) {
        // update name
        found.name = sanitized.name;
        // manage permissions
        setPermissions(res, newRole, sanitized.permissions, 'Role updated.');
      } else {
        return error(res, 401, 'Role not found.');
      }
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

  permission.find(query, function(err, perms) {
    if (err) {
      return error(res, 500, err.message);
    }

    // set permission
    newRole.permissions = perms;

    // save the new role
    newRole.save(function(err, rr) {
      if (err) {
        return error(res, 500, err.message);
      }

      res.json({
        success: true,
        message: message
      });
    });

  });
}

module.exports = router;
