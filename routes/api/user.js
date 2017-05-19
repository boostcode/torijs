var express = require('express');
var router = express.Router();
var account = require('../../models/account');
var tori = require('../../conf/tori.conf.js');
var jwt = require('jsonwebtoken');
var randtoken = require('rand-token');
var _ = require('underscore');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var error = require('../error');

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
router.post('/login', function(req, res) {
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
  account
    .findOne({
      username: username,
      token: token
    })
    .exec()
    .then(function(user) {
      // add user to request
      req.user = user
      // issue jwt
      issueJwt(req, res);
    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });
});

/// Logout
router.get('/logout', function(req, res) {

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

/// Create
router.post('/create', function(req, res) {

  account.register(new account({
    username: req.body.username
  }), req.body.password, function(err, account) {
    if (err) {
      return error(res, 500, err.message);
    }

    // TODO: consider add email confirmation

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
  // get username
  var username = req.body.username;
  // check if it has been provided
  if (!username) {
    return error(res, 404, 'Missing username.');
  }

  // find the username provided
  account
    .findOne({
      'username': username
    })
    .exec()
    .then(function(user) {
      // generate a password reset token
      var token = randtoken.generate(16);
      // store in the model
      user.resetPassword = token;
      // store all changes
      return user.save();
    })
    .then(function(savedUser) {
      var mailOptions = {
        from: tori.mail.from,
        to: user.username,
        subject: tori.core.title + ' | Reset password',
        text: 'Here you reset code: ' + user.resetPassword
      };
      // send a mail with token
      req.mail.sendMail(mailOptions, function(err, info) {

        if (err) {
          return error(res, 500, err.message);
        } else {

          res.json({
            success: true,
            msg: 'Reset password sent.'
          });

        }

      });

    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });

});

/// Change password
router.post('/change/password', function(req, res) {
  var username = req.body.username;
  var resetPassword = req.body.resetpassword;
  var newPassword = req.body.newpassword;

  if (!username) {
    return error(res, 404, 'Missing username.');
  }

  if (!resetPassword) {
    return error(res, 404, 'Missing reset password.');
  }

  if (!newPassword) {
    return error(res, 404, 'Missing new password.');
  }

  account
    .findOne({
      'username': username,
      'resetPassword': resetPassword
    })
    .exec()
    .then(function(user) {
      user.setPassword(newPassword, function(err) {
        if (err) {
          return error(res, 500, err.message);
        } else {

          user.resetPassword = undefined
          user.save();

          res.json({
            success: true,
            message: 'Password modified successfully.'
          });

        }
      });
    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });
});

/// Update user from data handler
function updateUser(req, user, data) {
  // omit forbidden fields
  data = _.omit(data, ['_id', '__v', 'id', 'username', 'password', 'token', 'resetPassword']);

  // extract roles
  var roles = _.pick(data, 'roles');
  // and remove from data
  data = _.omit(data, 'roles');

  // only admin user can change other user level
  if (req.user.isAdmin === false) {
    data = _.omit(data, ['isAdmin']);
  }

  // if admin
  if (req.user.isAdmin === true) {
    // and we have roles
    if (roles) {
      // remove all roles first
      user.removeAllRoles(function(err) {
        console.error(err);
      });
      // add that to user
      user.addRole(roles, function(err) {
        console.error(err);
      });
    }
  }

  // return updated user
  return _.extend(user, data);
}

/// Update current user
router.put('/update', function(req, res) {

  // update user passing request, user to update, new fields
  var user = updateUser(req, req.user, req.body).save();

  res.json({
    success: true,
    message: 'User updated.'
  });
});

/// Update third party user
router.put('/update/:id', function(req, res) {
  // only admin or dev can change third party user
  if (req.user.isAdmin == true) {
    // convert id from string to objectId
    var id = mongoose.Types.ObjectId(req.params.id);
    // find requested user
    account
      .findById(id)
      .exec()
      .then(function(user) {
        // update user and save
        updateUser(req, user, req.body).save();

        res.json({
          success: true,
          message: 'User updated.'
        });
      })
      .catch(function(err) {
        return error(res, 500, err.message);
      });
  } else {
    return error(res, 403, 'User has no permission');
  }
});

/// Remove user
router.delete('/delete/:id', function(req, res) {
  // TODO: add remove user
  /*
  account.findByIdAndRemove(req.body.userid, function(err, user) {

    if (err) {
      res.send(err);
      return;
    }

    res.send({
      confirm: 'ok'
    });

  });
  */
});

/// List of user
router.get('/list', function(req, res) {
  account
    .find({})
    .lean()
    .exec()
    .then(function(users) {
      // if current user is not admin or dev
      if (req.user.isAdmin == false) {
        users = _.map(users, function(user) {
          return _.omit(user, ['__v', 'password', 'token', 'resetPassword', 'roles', 'isAdmin']);
        });
      }

      res.json({
        success: true,
        users: users
      });
    })
    .catch(function(err) {
      return error(res, 500, err.message);
    });
});

/// Profile
router.get('/profile', function(req, res) {
  // omit forbidden fields
  var sanitizedUser = _.omit(req.user.toObject(), ['__v', 'password', 'token', 'resetPassword', 'roles', 'isAdmin']);

  res.json({
    success: true,
    user: sanitizedUser
  });
});


module.exports = router;
