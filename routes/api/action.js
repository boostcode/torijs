var express = require('express');
var router = express.Router();
var action = require('../../models/action');
var tori = require('../../conf/tori.conf.js');
var mongoose = require('mongoose');
var _ = require('underscore');
var error = require('../error');

/// List
router.get('/', function(req, res) {
  // only admin or dev can change third party user
  if (req.user.isAdmin == true) {
    action.find({}, function(err, actions) {
      if (err) {
        return error(res, 500, err.message);
      }
      res.json({
        success: true,
        action: actions
      })
    });
  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Create
router.post('/', function(req, res) {
  // only admin or dev can change third party user
  if (req.user.isAdmin == true) {

    var sanitized = _.pick(req.body, ['name', 'collectionRef', 'field', 'action', 'creatorMail', 'editorMail', 'receiver', 'trigger', 'filter', 'from', 'to', 'message']);

    if (sanitized.name == null || sanitized.collectionRef == null || sanitized.field == null || sanitized.action == null) {
      return error(res, 404, 'One or more of the required fields (name, collectionRef, field, action) are missing.')
    }

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
    action.findById(id, function(err, user) {
      if (err) {
        res.json({
          success: false,
          message: err.message
        });
        return;
      }

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
    action.findByIdAndRemove(id, function(err, action) {
      if (err) {
        return error(res, 500, err.message);
      }

      res.json({
        success: true,
        message: 'Action removed.'
      });
    });
  } else {
    return error(res, 403, 'User ha no permission');
  }
});

module.exports = router;
