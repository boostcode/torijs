var express = require('express');
var router = express.Router();
var action = require('../models/action');
var tori = require('../conf/tori.conf.js');

// list
router.post('/list.json', function(req, res) {
  var query = {};

  if (req.body.sSearch) {
    query = {
      name: req.body.sSearch
    };
  }

  action.find(query, function(err, actions) {
    if (err) {
      res.send({
        error: 'Action list error'
      });
      return;
    }

    var totElements = actions.length;

    if (req.body.iDisplayLength && req.body.iDisplayStart) {
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
router.post('/create', function(req, res) {
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

  if (a.to) {
    act.to = a.to;
  }

  if (a.from) {
    act.from = a.from;
  }

  act.save(function(err, saved) {
    if (err) {
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


// send email
router.post('/sendmail', function(req, res) {

  router.sendMail(req);

  res.send({
    confirm: 'ok'
  });

});

// send email
router.sendMail = function(req) {

  var actions = req.body.mailActions;

  actions.forEach(function(mailOptions) {

    req.mail.sendMail(mailOptions, function(err, info) {
      if (err) {
        console.log(err);
      } else {
        console.log(info);
      }
    });

  });

};

module.exports = router;
