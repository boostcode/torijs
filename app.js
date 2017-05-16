// Configuration
var tori = require('./conf/tori.conf.js');

// Express
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
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
var jwt = require('jsonwebtoken');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var tokenStrategy = require('passport-token').Strategy;
var token = require('token');
var account = require('./models/account');

// Database
var mongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var database = null;

// Email
var nodemailer = require('nodemailer');
var transport = null;
if(tori.mail.service == 'smtp') {
  transport = require('nodemailer-smtp-transport');
} else {
  transport = require('nodemailer-sendmail-transport');
}

if (transport == null) {
  console.error('❌  📨  Mail transport not setup, please check your configuration file');
  process.exit();
}

var mail = null;



var app = express();

// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'torijs',
  resave: true,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));


// database setup
app.use(function(req, res, next){
  if(database){
    req.db = database;
    next();
  }else{
    mongoClient.connect('mongodb://'+tori.database.host+'/'+tori.database.data, function(err, db) {
      if(db){
        req.db = database = db;
        next();
      }else{
        console.error('❌  🗄  Database connection problem');
        process.exit();
      }
    });
  }
});

mongoose.connect('mongodb://'+tori.database.host+'/'+tori.database.user);

// email setup
app.use(function(req, res, next){
  if(mail){
    req.mail = mail;
    next();
  }else{

    var emailSetup = {};

    // check if smtp is supported
    if(tori.mail.smtp.host != null){
      emailSetup =  tori.mail.smtp;
    }

    req.mail = mail = nodemailer.createTransport(transport(emailSetup));
    next();
  }
});


// local mongoose strategy
passport.use(account.createStrategy());
passport.serializeUser(account.serializeUser());
passport.deserializeUser(account.deserializeUser());

// local token strategy
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

app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res){
  res.redirect('/auth/login');
});

app.all('/*/import', multipartMiddleware);

app.all('/collection/*', passport.authenticate('token'));
app.all('/user/*', passport.authenticate('token'));
app.all('/role/*', passport.authenticate('token'));
app.all('/action/*', passport.authenticate('token'));

app.post('/auth/login', passport.authenticate('local'));

app.all('/admin/*', function (req, res, next){
  // checks if user is logged
  if(req.user){
    return next();
  }else{
    res.redirect('/auth/login');
  }
});


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
