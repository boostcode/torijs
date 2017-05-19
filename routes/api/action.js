var express = require('express');
var router = express.Router();
var action = require('../../models/action');
var tori = require('../../conf/tori.conf.js');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var _ = require('underscore');
var error = require('../error');

/// List
router.get('/', function(req, res) {
  // only admin or dev can change third party user
  if (req.user.isAdmin == true) {
    // get all actions
    action.find({}).exec()
      .then(function(actions) {
        return res.json({
          success: true,
          action: actions
        });
      })
      .catch(function(err) {
        return error(res, 500, err.message);
      });

  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Create
router.post('/', function(req, res) {
  // only admin or dev can change third party user
  if (req.user.isAdmin == true) {
    // sanitize inputs
    var sanitized = _.pick(req.body, ['name', 'collectionRef', 'field', 'action', 'creatorMail', 'editorMail', 'receiver', 'trigger', 'filter', 'from', 'to', 'message']);

    if (sanitized.name == null || sanitized.collectionRef == null || sanitized.field == null || sanitized.action == null) {
      return error(res, 404, 'One or more of the required fields (name, collectionRef, field, action) are missing.')
    }
    // create new action item
    var newAction = new action(sanitized);

    newAction.save(function(err, saved) {
      if (err) {
        return error(500, err.message);
      }
      res.json({
        success: true,
        message: 'Action created.'
      });
    });
  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Update
router.put('/:id', function(req, res) {
  // only admin or dev can change third party user
  if (req.user.isAdmin == true) {
    // convert id from string to objectId
    var id = mongoose.Types.ObjectId(req.params.id);
    // find requested user
    action.findById(id).exec()
      .then(function(action) {
        // sanitize body
        req.body = _.omit(data, ['id', '__v', '_id']);

        // merge
        _.extend(action, req.body);

        // save
        action.save();

        res.json({
          success: true,
          message: 'Action updated.'
        });
      })
      .catch(function(err) {
        return error(res, 500, err.message);
      });

  } else {
    return error(res, 403, 'User ha no permission');
  }
});

/// Remove
router.delete('/:id', function(req, res) {
  // only admin or dev can change third party user
  if (req.user.isAdmin == true) {
    // convert id from string to objectId
    var id = mongoose.Types.ObjectId(req.params.id);
    // find requested action
    action.findByIdAndRemove(id).exec()
      .then(function(action) {
        res.json({
          success: true,
          message: 'Action removed.'
        });
      })
      .catch(function(err) {
        return error(res, 500, err.message);
      });
  } else {
    return error(res, 403, 'User ha no permission');
  }
});

module.exports = router;
