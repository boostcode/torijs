var mongoose = require('mongoose');
var account = require('../models/account');
var torii = require('../conf/torii.conf.js');

mongoose.connect('mongodb://'+torii.conf.db.host+'/'+torii.conf.db.user);

var query = {
  username: 'a@a.it'
};

account.findOne(query, function(err, user){
  if(err){
    console.log(err);
  }

  user.isDev = true;
  user.save(function(err){
    if(err){
      console.log(err);
    }

    console.log('user set as dev');
    process.exit();
  });
});
