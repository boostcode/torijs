// Configuration
var torii = require('./conf/torii.conf.js');

// Express
var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var engine = require('ejs-locals');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();

// Routes
var action = require('./routes/action');
var admin = require('./routes/admin');
var auth = require('./routes/auth');
var collection = require('./routes/collection');
var role = require('./routes/role');
var perm = require('./routes/permission');
var user = require('./routes/user');

// Authentication
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var tokenStrategy = require('passport-token').Strategy;
var token = require('token');
var account = require('./models/account');

// Captcha
var rusty = require("rusty");

// Database
var mongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var database = null;

// Email
var nodemailer = require('nodemailer');
var transport = null;
if(torii.conf.mail.service == 'smtp'){
  transport = require('nodemailer-smtp-transport');
}else{
  transport = require('nodemailer-sendmail-transport');
}

if(transport == null){
  throw Error('Mail transport not setup, please check your configuration file');
}

var mail = null;

var app = express();

// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(session({
  secret: 'js.iirot'
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use("/captcha.png", rusty.middleware({
    width: 120,
    height: 50,
    chars: 'abcdefghjkmnopqrstuvwxyz',
    length: 4,
    fonts: ['20px sans', '20px bold sans'],
    session: 'captcha',
    color: '#000000'
}));

// database setup
app.use(function(req, res, next){
  if(database){
    req.db = database;
    next();
  }else{
    mongoClient.connect('mongodb://'+torii.conf.db.host+'/'+torii.conf.db.data, function(err, db) {
      if(db){
        req.db = database = db;
        next();
      }else{
        throw Error('Database connection problem');
      }
    });
  }
});

mongoose.connect('mongodb://'+torii.conf.db.host+'/'+torii.conf.db.user);

// email setup
app.use(function(req, res, next){
  if(mail){
    req.mail = mail;
    next();
  }else{

    var emailSetup = {};

    if(torii.conf.mail.host){
      emailSetup =  {
      host: torii.conf.mail.host,
      port: torii.conf.mail.port,
      secureConnection: torii.conf.mail.secureConnection,
      auth: {
        user: torii.conf.mail.user,
        pass: torii.conf.mail.pass
        }
      };

    }

    req.mail = mail = nodemailer.createTransport(transport(emailSetup));
    next();
  }
});

// force https
if(torii.conf.https){
    app.use(function(req, res, next) {
	  if (req.headers["x-forwarded-proto"] === "https"){
		  return next();
	  }
	  res.redirect("https://" + req.headers.host + req.url);
  });
}

// auth strategies
passport.use(new localStrategy(account.authenticate()));
passport.serializeUser(account.serializeUser());
passport.deserializeUser(account.deserializeUser());

passport.use(new tokenStrategy( function(username, tokenLogin, done) {
    account.findOne({ username: username }, function (err, user) {
      if(err){
        return done(err);
      }

      if(!user){
        return done(null, false);
      }

      if(tokenLogin != user.token){
        return done(null, false);
      }

      return done(null, user);
    });
  })
);

function isLogged(req, res,next){
  if(req.user){
    return next();
  }else{
    res.redirect('/auth/login');
  }
}

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res){
  res.redirect('/auth/login');
});

app.post("/auth/mobile", passport.authenticate('local'));

app.post("/auth/login", rusty.verifyCaptcha, function(req, res,next) {
    if(req.body.api){
      passport.authenticate('local')(req, res, next);
    }else{
      if(req.verifyCaptcha(req.body.captcha)) {
        passport.authenticate('local')(req, res, next);
      }else{
        res.send(401,{ error: 'invalid captcha' })
      }
    }
});

app.all('/*/import', multipartMiddleware);

app.all('/collection/*', passport.authenticate('token'));
app.all('/user/*', passport.authenticate('token'));
app.all('/role/*', passport.authenticate('token'));
app.all('/action/*', passport.authenticate('token'));

app.all('/admin/*', isLogged);


// Setup Routes
app.use('/role', role);
app.use('/action', action);
app.use('/auth', auth);
app.use('/collection', collection);
app.use('/permission', perm);
app.use('/user', user);
app.use('/admin', admin);


/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        console.log(err.message);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

module.exports = app;
