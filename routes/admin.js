var express = require('express');
var router = express.Router();
var account = require('../models/account');
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var torii = require('../conf/torii.conf.js');

// admin root
router.get('/', function(req, res){
  res.render('adminHome', {
    logged: req.user,
    toriiTitle: torii.conf.core.title,
    welcomeSubtitle: torii.conf.core.welcomeSubtitle,
    welcomeTitle: torii.conf.core.welcomeTitle,
    welcomeMessage: torii.conf.core.welcomeMessage
  });
});

// user - list
router.get('/user/list', function(req, res){
  res.render('adminUserList',{
    logged: req.user,
    toriiTitle: torii.conf.core.title
  });
});

// user - new
router.get('/user/new', function(req, res){
  role.find({}, function(err, roles){
    res.render('adminUserNew',{
      toriiTitle: torii.conf.core.title,
      logged: req.user,
      roles: roles
    });
  });
});

// user - edit
router.get('/user/:userid/edit', function(req, res){
  account.findById(req.params.userid, '_id username role isAdmin isDev name surname extraFields', function(err, user){
    if(err){
      res.send(err);
      return;
    }

    user._id = user._id.toHexString();

    role.find({}, function(err, roles){
      if(err){
        res.send(err);
        return;
      }

      res.render('adminUserEdit',{
        toriiTitle: torii.conf.core.title,
        logged: req.user,
        user: user,
        roles: roles
      });
    });
  });
});


// action - list
router.get('/action/list', function(req, res){
  res.render('adminActionList', {
    toriiTitle: torii.conf.core.title,
    logged: req.user
  });
});

// action - new
router.get('/action/new', function(req, res){
  res.render('adminActionNew', {
    toriiTitle: torii.conf.core.title,
    logged: req.user
  });
});

// action - edit
router.get('/action/:action_id/edit', function(req, res){
  res.render('adminActionEdit', {
    toriiTitle: torii.conf.core.title,
    logged: req.user
  });
});


// role - new
router.get('/role/new', function(req, res){
  res.render('adminRoleNew',{
    toriiTitle: torii.conf.core.title,
    logged: req.user
  });
});

// role - list
router.get('/role/list', function(req, res){
  res.render('adminRoleList',{
    toriiTitle: torii.conf.core.title,
    logged: req.user
  });
});

// role - edit
router.get('/role/:role_id/edit', function(req, res){
  role.findById(req.params.role_id, function(err, role){
    if(err){
      res.send(err);
      return;
    }

    res.render('adminRoleEdit', {
      toriiTitle: torii.conf.core.title,
      logged: req.user,
      req: req,
      role: role
    });
  });
});


// collections list
router.get('/collections', function(req, res){
  res.render('adminCollectionList', {
    toriiTitle: torii.conf.core.title,
    req: req,
    logged: req.user
  });
});

// collection new
router.get('/collection/new', function(req, res){
  res.render('adminCollectionNew', {
    toriiTitle: torii.conf.core.title,
    req: req,
    logged: req.user
  });
});

// document - list
router.get('/:collection_name/documents', function(req, res){
  req.user.can('backend-read', req.params.collection_name, function(err,can){
    if(err){
      res.send(err);
      return;
    }

    if(can || req.user.isDev){
      res.render('adminDocumentList', {
        toriiTitle: torii.conf.core.title,
        req: req,
        logged: req.user
      });
    }else{
      res.send(401, 'user are not allowed');
    }

  });
});

// document - new
router.get('/:collection_name/new', function(req, res){
  req.user.can('backend-write', req.params.collection_name, function(err, can){
    if(err){
      res.send(err);
      return;
    }

    if(can || req.user.isDev){
      res.render('adminDocumentNew',{
        toriiTitle: torii.conf.core.title,
        req: req,
        logged: req.user
      });
    }else{
      res.send(401, 'user not allowed');
    }
  });
});

// document - import
router.get('/:collection_name/import', function(req, res){
  req.user.can('backend-write', req.params.collection_name, function(err, can){
    if(err){
      res.send(err);
      return;
    }

    if(can || req.user.isDev){

      res.render('adminDocumentImportCSv', {
        toriiTitle: torii.conf.core.title,
        req: req,
        logged: req.user
      });
    }else{

      res.send(401, 'user not allowed');
      return;
    }
  });
});

// document - edit
router.get('/:collection_name/:document_id/edit', function(req, res){
  req.user.can('backend-write', req.params.collection_name, function(err, can){
    if(err){
      res.send(err);
      return;
    }

    if(can || req.user.isDev){
      res.render('adminDocumentEdit',{
        toriiTitle: torii.conf.core.title,
        req: req,
        logged: req.user
      });
    }else{
      res.send(401, 'user not allowed');
    }
  });
});


module.exports = router;
