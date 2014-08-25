var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var oID = require('mongodb').ObjectID;
var _ = require('underscore');

// create
router.post('/create', function(req, res){
  var r = new role({
    name: req.body.roleName
  });

  var permList = Array();

  req.body.permissions.forEach(function(perm){
    permList.push( new oID.createFromHexString(perm.pid));
  });

  var query = {
      _id: { 
        $in: permList
      }
  };

  permission.find(query, function(err, perms){
    if(err){
      res.send(err);
      return
    }

    r.permissions = perms;

    r.save(function(err, rr){
      if(err){
        res.send(err);
        return;
      }

      res.send(rr);
    });

  });
});

// remove
router.post('/remove', function(req, res){
  role.findByIdAndRemove(req.body.roleid, function(err, role){
    if(err){
      res.send(err);
      return;
    }

    res.send({
      confirm: 'ok'
    });
  });
});

// list
router.post('/list.json', function(req, res){
  var query = {};

  if(req.query.sSearch){
    query = {
      name: req.query.sSearch
    };
  }

  role.find(query, function(err, roles){
    
    if(err){
      res.send(err);
      return;
    }
    
    var totElements = roles.length;

    if(req.query.iDisplayLength && req.query.iDisplayStart){
      roles = roles.splice(req.query.iDisplayStart, req.query.iDisplayLength);
    }

    res.send({
      sEcho: parseInt(req.query.sEcho),
      iTotalRecords: totElements,
      iTotalDisplayRecords: roles.length,
      aaData: roles,
      serverTime: new Date().getTime()
    });

  });
});

module.exports = router;
