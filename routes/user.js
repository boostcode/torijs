var express = require('express');
var router = express.Router();
var account = require('../models/account');
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var tori = require('../conf/tori.conf.js').tori;
var _ = require('underscore');



// list
router.post('/list.json', function(req, res) {
  var query = {};

  if (req.body.sSearch) {
    query = {
      'name': req.body.sSeach
    };
  }

  role.find({}, function(err, roles) {
    if (err) {
      res.send(err);
      return;
    }

    account.find(query, '_id username roles token name surname', function(err, users) {
      if (err) {
        res.send({
          error: 'User list not found'
        });
        return;
      }

      var totalElements = users.length;


      if (req.body.page) {
        users = users.slice((req.body.page - 1) * req.body.count, req.body.page * req.body.count);
        console.log(users);
      }

      // TODO: order via underscore
      //
      // req.body.filter
      // req.body.sorting

      users.forEach(function(user) {
        roles.forEach(function(role) {
          if (JSON.stringify(user.roles[0]) == JSON.stringify(role._id)) {
            user.roles[0] = role.name;
          }
        });
      });

      /*res.send({
        sEcho: parseInt(req.query.sEcho),
        iTotalRecords: totElementi,
        iTotalDisplayRecords: users.length,
        aaData: users,
        serverTime: new Date().getTime()
      });*/

      res.send({
        result: users,
        total: totalElements
      });

    });
  });
});


module.exports = router;
