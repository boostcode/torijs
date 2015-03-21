var express = require('express');
var router = express.Router();
var action = require('../models/action');
var torii = require('../conf/torii.conf.js');

// list
router.post('/list.json',function(req,res){
  var query = {};

  if(req.body.sSearch){
    query = {
      name: req.body.sSearch
    };
  }

  action.find(query, function(err, actions){
    if(err){
      res.send({
        error: 'Action list error'
      });
      return;
    }

    var totElements = actions.length;

    if(req.body.iDisplayLength && req.body.iDisplayStart){
      actions = actions.splice(req.body.iDisplayStart, req.body.iDisplayLength);
    }

    res.send({
      sEcho: parseInt(req.query.sEcho),
      iTotalRecords: totElements,
      iTotalDisplayRecords: actions.length,
      aaData: actions,
      serverTime: new Date().getTime()
    });
  });
});


// create
router.post('/create', function(req, res){
  var a = req.body.values;

  var act = new action({
    name: a.name,
    collectionName: a.collection,
    field: a.field,
    filter: a.filter,
    creatorMail: a.creatormail,
    editorMail: a.editormail,
    receiver: a.receiver,
    action: a.action,
    trigger: a.trigger,
    message: a.message
  });

  if(a.to){
    act.to = a.to;
  }

  if(a.from){
    act.from = a.from;
  }

  act.save(function(err, saved){
    if(err){
      res.send({
        error: 'Action - Error creating new'
      });
      return;
    }

    res.send({
      status: 'ok',
      data: saved
    });
  });
});

// update
router.post('/update', function(req, res){
  action.findById(req.body.actionid, function(err, action){
    if(err){
      res.send({
        error: 'Action - Error finding '+req.body.actionid
      });
      return;
    }

    if(req.body.name.length >0 && req.body.name != action.name){
      action.name = req.body.name;
    }

    if(req.body.collection != action.collectionName){
      action.collectionName = req.body.collection;
    }

    if(req.body.field != action.field){
      action.field = req.body.collection;
    }

    if(req.body.receiver != action.receiver){
      action.receiver = req.body.receiver;
    }

    if(req.body.action != action.action){
      action.action = req.body.action;
    }

    if(req.body.trigger != action.trigger){
      action.trigger = req.body.trigger;
    }

    if(req.body.to.length >0 && req.body.to != action.to){
      action.to = req.body.to;
    }

    if(req.body.from.length >0 && req.body.from != action.from){
      action.from = req.body.from;
    }

    if(req.body.message.length >0 && req.body.message != action.message){
      action.message = req.body.message;
    }

    action.save();

  });
});

// remove
router.post('/remove', function(req, res){
  action.findByIdAndRemove(req.body.actionid, function(err, action){
    if(err){
      res.send({
        error: 'Action - Error removing '+req.body.actionid
      });
      return;
    }

    res.send({
      confirm: 'ok'
    });
  });
});

// send email
  router.post('/sendmail', function(req, res){

  router.sendMail(req);

  res.send({
      confirm: 'ok'
    });

});

// send email
router.sendMail = function(req) {

	var actions = req.body.mailActions;

  actions.forEach(function(mailOptions){

    req.mail.sendMail(mailOptions, function(err, info){
      if(err){
        console.log(err);
      }else{
        console.log(info);
      }
    });

  });

};

module.exports = router;
