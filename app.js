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
var app = express();

/// Engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(session({
  secret: tori.core.secret,
  resave: true,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
var action = require('./routes/action');
var admin = require('./routes/admin');
var collection = require('./routes/collection');
var role = require('./routes/role');
var user = require('./routes/user');

// Api
var userApi = require('./routes/api/user');
var permissionApi = require('./routes/api/permission');

// 🔑  Authentication
var jwt = require('jsonwebtoken');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var tokenStrategy = require('passport-token').Strategy;
var account = require('./models/account');

/// local mongoose strategy
passport.use(account.createStrategy());
passport.serializeUser(account.serializeUser());
passport.deserializeUser(account.deserializeUser());

/// token strategy
function tokenAuth(req, res, next) {
  // get the token
  var token = req.headers['x-access-token'];

  // get username
  var username = req.headers['x-access-username'];

  // if username is missing
  if (!username) {
    return res.status(403).send({
      success: false,
      message: 'Missing username.'
    });
  }

  // if token exists, and has at least a char
  if (token && token.length > 1) {
    jwt.verify(token, tori.core.secret, function(err, decoded) {
      if (err) {
        return res.status(401).json({
          success: false,
          message: err.message
        });
      } else {
        // retrieve current user
        account.findOne({
          username: username,
          token: token
        }).exec(function(err, user) { // mongoose.lean() transform the Model to Object
          if (err) {
            return res.status(401).json({
              success: false,
              message: 'Invalid username.'
            });
          } else {
            if (user) {
              req.user = user
              next();
            } else {
              return res.status(401).json({
                success: false,
                message: 'Invalid token.'
              });
            }
          }
        });
      }
    })
  } else {
    return res.status(403).send({
      success: false,
      message: 'Missing token.'
    });
  }
}

app.use(passport.initialize());
app.use(passport.session());


/// 🗄 Database setup
var mongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var database = null;
app.use(function(req, res, next) {
  if (database) {
    req.db = database;
    next();
  } else {
    mongoClient.connect('mongodb://' + tori.database.host + '/' + tori.database.data, function(err, db) {
      if (db) {
        req.db = database = db;
        next();
      } else {
        console.error('❌  🗄  Database connection problem');
        process.exit();
      }
    });
  }
});

mongoose.connect('mongodb://' + tori.database.host + '/' + tori.database.user);


/// 📨 Email
var nodemailer = require('nodemailer');
var transport = null;
if (tori.mail.service == 'smtp') {
  transport = require('nodemailer-smtp-transport');
} else {
  transport = require('nodemailer-sendmail-transport');
}

if (transport == null) {
  console.error('❌  📨  Mail transport not setup, please check your configuration file');
  process.exit();
}

var mail = null;

app.use(function(req, res, next) {
  if (mail) {
    req.mail = mail;
    next();
  } else {

    var emailSetup = {};

    // check if smtp is supported
    if (tori.mail.smtp.host != null) {
      emailSetup = tori.mail.smtp;
    }

    req.mail = mail = nodemailer.createTransport(transport(emailSetup));
    next();
  }
});



/// Routing
app.get('/', function(req, res) {
  res.redirect('/authenticate/login');
});

// remove those
//app.all('/collection/*', tokenAuth);
//app.all('/user/*', tokenAuth);
//app.all('/role/*', tokenAuth);
//app.all('/action/*', tokenAuth);

app.post('/api/user/login', passport.authenticate('local'));
app.get('/api/user/logout', tokenAuth);
app.get('/api/user/remove', tokenAuth);
app.get('/api/user/list', tokenAuth);
app.get('/api/user/profile', tokenAuth);
app.post('/api/user/update*', tokenAuth);

/*app.all('/admin/*', function (req, res, next){
  // checks if user is logged
  if(req.user){
    return next();
  }else{
    res.redirect('/authenticate/login');
  }
});*/


/// Setup Routes
app.use('/api/user', userApi);
app.use('/api/permission', permissionApi);
app.use('/role', role);
app.use('/action', action);
app.use('/collection', collection);
app.use('/user', user);
app.use('/admin', admin);


/// Error handlers

if (app.get('env') === 'development') {
  // development error handler, will print stacktrace
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err.message);
    res.render('error', {
      message: err.message,
      success: false
    });
  });
}

// production error handler, no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    success: false
  });
});


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = app;
