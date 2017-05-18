var express = require('express');
var router = express.Router();
var action = require('../models/action');
var tori = require('../conf/tori.conf.js');

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
