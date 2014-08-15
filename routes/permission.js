var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var permission = rbac.permission;
var _ = require('underscore');

// list
router.post('/list.json', function(req, res){
  var query = {};

  permission.find(query, function(err, perms){
    if(err){
      res.send(err);
      return;
    }

    res.send(_.groupBy(perms, 'subject'));

  });
});

module.exports = router;
