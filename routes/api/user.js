var express = require('express');
var router = express.Router();
var account = require('../../models/account');
var tori = require('../../conf/tori.conf.js');
var jwt = require('jsonwebtoken');
var randtoken = require('rand-token');
var _ = require('underscore');
var mongoose = require('mongoose');

/// JWT Issuer
function issueJwt(req, res) {
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
}

/// Login
router.post('/login', function(req, res){
  // issue jwt
  issueJwt(req, res);
});

/// Refresh login token
router.post('/refresh/token', function(req, res) {
  // this called is needed when any call return 401, with message: jwt expired

  // try to get the token
  var token = req.body.token || req.param('token') || req.headers['x-access-token'];

  // try to get username
  var username = req.body.username || req.param('username') || req.headers['x-access-username'];

  // check if user and expired token exist
  account.findOne({ username: username, token: token }, function (err, user) {
    if (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username.'
      });
    } else {
      if (user) {
        req.user = user
        // issue jwt
        issueJwt(req, res);
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid token.'
        });
      }
    }
  });
});

/// Logout
router.get('/logout', function(req, res){

  // remove token
  req.user.token = null;
  req.user.save();
  // force quit session
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

  // TODO: improve registration with extra fields
});

/// Request token for password
router.post('/reset/password', function(req, res) {

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

/// Update user from data handler
function updateUser(req, user, data) {
  // omit forbidden fields
  data = _.omit(data, ['username', 'password', 'token', 'resetPassword']);

  // only admin or dev user can change other user level
  if (req.user.isAdmin == false || req.user.isDev == false) {
    data = _.omit(data, ['isDev', 'isAdmin']);
  }

  // return updated user
  return _.extend(user, data);
}

/// Update current user
router.post('/update', function(req, res) {

  // update user passing request, user to update, new fields
  var user = updateUser(req, req.user, req.body).save();

  res.json({
    success: true,
    message: 'User updated.'
  });
});

/// Update third party user
router.post('/update/:id', function(req, res) {
  // only admin or dev can change third party user
  if (req.user.isAdmin == true || req.user.isDev == true) {
    // convert id from string to objectId
    var id = mongoose.Types.ObjectId(req.params.id);
    // find requested user
    account.findById(id, function(err, user){
      if (err){
        res.json({
          success: false,
          message: err.message
        });
        return;
      }
      // update user and save
      updateUser(req, user, req.body).save();

      res.json({
        success: true,
        message: 'User updated.'
      });
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'User has no permission'
    });
  }
});

/// Remove user
router.get('/remove', function(req, res){

});

/// List of user
router.get('/list', function(req, res){
  account.find({}).lean().exec(function(err, users){
    if (err) {
      res.json({
        success: false,
        message: err.message
      });
      return;
    }

    // if current user is not admin or dev
    if (req.user.isDev == false && req.user.isAdmin == false) {
      users = _.map(users, function(user) {
        return _.omit(user, ['__v','password', 'token', 'resetPassword', 'roles', 'isDev', 'isAdmin']);
      });
    }

    res.json({
      success: true,
      users: users
    });
  });
});

/// Profile
router.get('/profile', function(req, res){

  // omit forbidden fields
  var sanitizedUser = _.omit(req.user.toObject(), ['__v','password', 'token', 'resetPassword', 'roles', 'isDev', 'isAdmin']);

  res.json({
    success: true,
    user: sanitizedUser
  });
});


module.exports = router;
