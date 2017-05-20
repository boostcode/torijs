var express = require('express');
var router = express.Router();
var account = require('../../models/account');
var action = require('../../models/action');
var tori = require('../../conf/tori.conf.js');

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var rbac = require('mongoose-rbac');
var permission = rbac.Permission;

var oID = require('mongodb').ObjectID;
var fs = require('fs');
var _ = require('underscore');
var actionFunction = require('../../routes/action');
var template = require('template');
var S = require('string');

var error = require('../error');

/// List of collection
// TODO: only is admin
router.get('/', function(req, res) {
  var structure = req.db.collection('tori_structure');

  structure.find({}).exec()
    .then(function(collections) {

      // filter out system, tori_structure, tori_removed
      collections = _.filter(collections, function(coll) {
        return coll.name != 'system' || coll.name != 'tori_structure' || coll.name != 'tori_removed'
      });

      res.json({
        success: true,
        collection: collections,
        serverTime: new Date().getTime()
      });
    })
    .catch(function(err) {
      error(res, 500, err.message);
    });
});

/// Create a new collection
router.post('/', function(req, res) {

});

/// Delete collection (soft-delete)
router.delete('/', function(req, res) {

});

module.exports = router;
