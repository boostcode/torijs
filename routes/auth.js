var express = require('express');
var router = express.Router();
var account = require('../models/account');
var token = require('token');
var rbac = require('mongoose-rbac');
var role = rbac.Role;
var permission = rbac.Permission;
var tori = require('../conf/tori.conf.js');
var oID = require('mongodb').ObjectID;
var randtoken = require('rand-token');

// token setup
token.defaults.secret = 'torijs';
token.defaults.timeStep = 24 * 60 * 60;

router.get('/login', function(req, res){
  res.render('userLoginForm', {
    toriAllowPublicRegistration: tori.core.allowPublicUserRegistration,
    toriTitle: tori.core.title
  });
});

router.post('/login', function(req, res){

  var token = token.generate(req.user.username+'|'+req.user.id);

  var token = jwt.sign(req.user.id, app.get('superSecret'), {
          expiresInMinutes: 1440 // expires in 24 hours
        });

  account.findById(req.user.id, function(err, user){
    user.token = token;
    user.save();
  });

  res.send({
    name: req.user.username,
    token: token,
    id: req.user.id
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

// new password
router.post('/getuniquecode', function(req, res) {

  account.find({"username" : req.body.username}, function(err, users) {

    if(err) {
      res.send(err);
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
					res.send({
						status: 'Errore',
						msg: err
  				});

      	} else {

        	console.log(info);
					res.send({
						status: 'Successo',
						msg: 'Mail inviata'
  				});

      	}

    	});

    } else {

	    res.send({
				status: 'Attenzione',
				msg: 'Utente non esistente'
  		});

    }

  });

});

// change password
router.post('/changepassword', function(req, res) {

  account.find({"username" : req.body.username, "resetPassword" : req.body.uniquecode}, function(err, users) {

    if(err) {
      res.send({

				status: 'Errore',
				msg: err

  		});
      return;
    }

    if (users.length > 0) {

	    user = users[0];

			user.setPassword(req.body.newpassword, function(err){
          if(err){
            console.log(err);

            res.send({
						status: 'Errore',
						msg: err
  				});

          }else{

	          user.resetPassword = undefined
            user.save();

            res.send({

							status: 'Successo',
							msg: 'Password cambiata correttamente'

  					});

          }
        });


			res.send({

				status: 'Successo',
				msg: 'Password cambiata correttamente'

  		});

    } else {

	    res.send({
				status: 'Attenzione',
				msg: 'Utente e codice non combaciano'
  		});

    }

  });

});

module.exports = router;
