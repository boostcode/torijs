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

/*
  Single Collection
*/

// checks if collection passed is valid
router.param('collection', function(req, res, next, id) {
  var structure = req.db.collection('tori_structure');
  id = new oID.createFromHexString(id);
  structure.findById(id)
    .then(function(collection) {
      req.collection = collection
      next();
    })
    .catch(function(err) {
      next(err);
    });
});

/// Has update
router.get('/:collection/has/update', function(req, res) {
  // get last update
  var lastUpdate = req.body.lastUpdate;

  // check last update exists
  if (lastUpdate == null) {
    return error(res, 404, 'Missing lastUpdate.');
  }
  // TODO: improve permission
  req.user.can('api-read', req.params.collection, function(err, can) {
    // check if user can or is admin
    if (can == true || req.user.isAdmin == true) {
      // setup the query
      var query = {
        last_update: {
          "$gt": parseFloat(data)
        }
      };

      // get updated items
      req.collection.find(query)
        .then(function(items) {
          res.send({
            success: true,
            update: items.length,
            serverTime: new Date().getTime()
          });
        })
        .catch(function(err) {
          error(res, 500, err.message);
        });
    }
  });
});

/// List of items in collection
router.get('/:collection', function(req, res) {

});

/// Add entry in collection
router.post('/:collection', function(req, res) {

});

/// Remove all objects (soft-delete)
router.delete('/:collection/all', function(req, res) {

});

/*
  Document of Collection
*/

// Check document passed is valid
router.param('document', function(req, res, next, id) {
  id = new oID.createFromHexString(id);
  req.collection.findById(id)
    .then(function(document) {
      req.document = document;
      next();
    })
    .catch(function(err) {
      next(err);
    });
});

/// Get Document
router.get('/:collection/:document', function(req, res) {

});

/// Update Document
router.put('/:collection/:document', function(req, res) {

});

/// Delete document
router.delete('/:collection/:document', function(req, res) {

});

module.exports = router;
