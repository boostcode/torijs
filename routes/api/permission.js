var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var permission = rbac.Permission;
var _ = require('underscore');

/// List
router.post('/list', function(req, res){
  var query = {};

  permission.find(query, function(err, perms){
    if(err){
      res.json({
        success: false,
        message: err
      });
      return;
    }

    // TODO: improve respose
    res.json(_.groupBy(perms, 'subject'));

  });
});

module.exports = router;
