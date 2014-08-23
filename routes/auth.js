var express = require('express');
var router = express.Router();
var account = require('../models/account');
var token = require('token');
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var torii = require('../conf/torii.conf.js').torii;
var oID = require('mongodb').ObjectID;

// token setup
token.defaults.secret = 'toriijs';
token.defaults.timeStep = 24 * 60 * 60;

router.get('/login', function(req, res){
  res.render('userLoginForm', {
    toriiAllowPublicRegistration: torii.conf.core.allowPublicUserRegistration,
    toriiTitle: torii.conf.core.title
  });
});

router.post('/login', function(req, res){

  var userToken = token.generate(req.user.username+'|'+req.user.id);

  account.findById(req.user.id, function(err, user){
    user.token = userToken;
    user.save();
  });

  res.send({
    name: req.user.username,
    token: userToken,
    id: req.user.id
  });

});

router.get('/register', function(req, res){
  
	if(!torii.conf.core.allowPublicUserRegistration){
		res.redirect('/auth/login')
		return
	}
	
	res.render('userRegistrationForm',{
		toriiTitle: torii.conf.core.title
	});
});

router.post('/register', function(req, res){
  
  account.register(new account({
    username: req.body.username
  }), req.body.password, function(err, account){
    if(err){
      res.send(err);
      return
    }
    
    res.send({
      user: req.body.username
    });

  });
});

module.exports = router;
