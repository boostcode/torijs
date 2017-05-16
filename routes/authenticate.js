var express = require('express');
var router = express.Router();
var account = require('../models/account');
var token = require('token');
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var tori = require('../conf/tori.conf.js');
var oID = require('mongodb').ObjectID;

router.get('/login', function(req, res){
  res.render('userLoginForm', {
    toriAllowPublicRegistration: tori.core.allowPublicUserRegistration,
    toriTitle: tori.core.title
  });
});

router.get('/register', function(req, res){

	if(!tori.core.allowPublicUserRegistration){
		res.redirect('/auth/login')
		return
	}

	res.render('userRegistrationForm',{
		toriTitle: tori.core.title
	});
});

module.exports = router;
