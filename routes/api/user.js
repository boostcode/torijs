var express = require('express');
var router = express.Router();
var account = require('../../models/account');
var tori = require('../../conf/tori.conf.js');
var jwt = require('jsonwebtoken');
var randtoken = require('rand-token');

/// Login
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

/// Logout
router.post('/logout', function(req, res){

  // remove token
  req.user.token = null;
  req.user.save();

  req.logout();

  res.json({
    success: true,
    message: 'User logged out.'
  });
});

/// Register
router.post('/register', function(req, res){

  account.register(new account({
    username: req.body.username
  }), req.body.password, function(err, account){
    if(err){
      res.json({
        success: false,
        message: err
      });
      return;
    }

    res.json({
      user: req.body.username,
      message: 'User created.',
      success: true
    });

  });
});

/// Request token for password
router.post('/reset/token', function(req, res) {

  var username = req.body.username;

  if(!username) {
    res.json({
      success: false,
      message: 'Missing username.'
    });
    return
  }

  account.find({ 'username' : username}, function(err, users) {

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
				subject: tori.core.title + ' | Reset password',
				text: 'Here you reset code: '+ user.resetPassword
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

/// Change password
router.post('/change/password', function(req, res) {

  var username = req.body.username;
  var resetPassword = req.body.resetpassword;
  var newPassword = req.body.newpassword;

  if (!username) {
    res.json({
      success: false,
      message: 'Missing username.'
    });
    return;
  }

  if (!resetPassword) {
    res.json({
      success: false,
      message: 'Missing reset password.'
    });
    return;
  }

  if (!newPassword) {
    res.json({
      success: false,
      message: 'Missing new password.'
    });
    return;
  }

  account.find({ 'username' : username, 'resetPassword' : resetPassword }, function(err, users) {

    if(err) {
      res.json({
				success: false,
				message: err
  		});
      return;
    }

    if (users.length > 0) {

	    user = users[0];

			user.setPassword(newPassword, function(err){
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
