var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var oID = require('mongodb').ObjectID;
var _ = require('underscore');

// create
router.post('/create', function(req, res) {
  var r = new role({
    name: req.body.roleName
  });

  var permList = Array();

  req.body.permissions.forEach(function(perm) {
    permList.push(new oID.createFromHexString(perm.pid));
  });

  var query = {
    _id: {
      $in: permList
    }
  };

  permission.find(query, function(err, perms) {
    if (err) {
      res.send(err);
      return
    }

    r.permissions = perms;

    r.save(function(err, rr) {
      if (err) {
        res.send(err);
        return;
      }

      res.send(rr);
    });

  });
});

module.exports = router;
