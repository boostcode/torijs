var express = require('express');
var router = express.Router();
var account = require('../../models/account');
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var tori = require('../../conf/tori.conf.js');
var oID = require('mongodb').ObjectID;
var jwt = require('jsonwebtoken');


router.post('/login', function(req, res){
  var token = jwt.sign(req.user, tori.core.secret, {
    expiresIn: tori.core.expires // expires in 2 days
  });

  req.user.token = token;
  req.user.save();

  res.json({
    name: req.user.username,
    token: token,
    success: true
  });

});

router.post('/logout', function(req, res){

  // remove token
  req.user.token = null;
  req.user.save();

  res.json({
    success: true,
    message: 'User logged out.'
  });
});

router.post('/register', function(req, res){

  account.register(new account({
    username: req.body.username
  }), req.body.password, function(err, account){
    if(err){
      res.json({
        success: false,
        message: err
      });
      return
    }

    res.json({
      user: req.body.username,
      success: true
    });

  });
});

// new password
router.post('/reset/token', function(req, res) {

  account.find({"username" : req.body.username}, function(err, users) {

    if(err) {
      res.json({
        success: false,
        message: err
      });
      return;
    }

    if (users.length > 0) {

	    user = users[0];

			var token = randtoken.generate(16);

			user.resetPassword = token;

    	// store all changes
			user.save();

			var mailOptions = {

      	from: tori.mail.from,
				to: user.username,
				subject: 'Reset password',
				text: 'Questo e il tuo nuovo codice: '+ user.resetPassword +' inseriscilo sull ipad'

    	};

			req.mail.sendMail(mailOptions, function(err, info){

      	if(err) {

        	console.log(err);
					res.json({
            success: false,
						message: err
  				});

      	} else {

        	console.log(info);
					res.json({
						success: true,
						msg: 'Mail sent.'
  				});

      	}

    	});

    } else {

	    res.json({
				success: false,
				message: 'User does not exists.'
  		});

    }

  });

});

// change password
router.post('/change/password', function(req, res) {

  account.find({"username" : req.body.username, "resetPassword" : req.body.uniquecode}, function(err, users) {

    if(err) {
      res.json({
				success: false,
				message: err
  		});
      return;
    }

    if (users.length > 0) {

	    user = users[0];

			user.setPassword(req.body.newpassword, function(err){
          if(err){
            console.log(err);

            res.json({
              success: false,
              message: err
  				  });

          }else{

	          user.resetPassword = undefined
            user.save();

            res.json({
							success: true,
              message: 'Password modified successfully.'
  					});

          }
        });

    } else {

	    res.send({
				success: false,
        message: 'User and token supplied are not valid.'
  		});

    }

  });

});

module.exports = router;
