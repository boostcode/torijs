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
  // sanitize input (name, fields)
  // fields has several items (label, order, type, unique, default, values)
  // type is different type of field (string, file, etc.)
  // default is default value (string)
  // values is supported fixed values user can change within (array)
  var sanitized = _.pick(req.body, ['name', 'fields']);

  if (sanitized.name == null) {
    return error(res, 404, 'Missing collection name.');
  }

  if (sanitized.fields == null) {
    return error(res, 404, 'Missing collection fields.');
  }

  // create new collection
  req.db.createCollection(sanitized.name)
    .then(function(coll) {
      var structure = req.db.collection('tori_structure');
      structure.insert(sanitized)
        .then(function(done) {
          createPermission(req, done.id);
          res.json({
            success: true,
            message: 'Collection created.'
          });
        })
        .catch(function(err) {
          error(res, 500, err.message);
        });
    })
    .catch(function(err) {
      error(res, 500, err.message);
    });
});

/// Delete collection (soft-delete)
router.delete('/', function(req, res) {
  var id = req.body.id;
  if (id == null) {
    return error(res, 404, 'Missing collection id');
  }
  // transform id ot Object
  id = new oID.createFromHexString(id);

  // drop the collection
  req.db.dropCollection(id)
    .then(function(coll) {
      var structure = req.db.collection('tori_structure');
      return structure.remove({
        name: id
      });
    })
    .then(function(removed) {
      permission.remove({
        subject: id
      }, function(err) {
        error(res, 500, err.message);
      });
    })
    .catch(function(err) {
      error(res, 500, err.message);
    });
});

// Create permission
function createPermission(req, collection) {
  permission.create([{
      subject: collection,
      action: 'api-read'
    },
    {
      subject: collection,
      action: 'api-write'
    }
  ], function(err) {
    if (err) {
      console.error(err);
      return;
    }
  });
}

module.exports = router;
