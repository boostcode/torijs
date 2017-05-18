var express = require('express');
var router = express.Router();
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var oID = require('mongodb').ObjectID;
var _ = require('underscore');
var error = require('../error');

/// List
router.get('/', function(req, res) {

});

/// Create
router.post('/', function(req, res) {

});

/// Update
router.put('/:id', function(req, res) {

});

/// Remove
router.delete('/:id', function(req, res) {

});
