var mongoose = require('mongoose');
var account = require('../models/account');
var tori = require('../conf/tori.conf.js');

mongoose.connect('mongodb://'+tori.conf.db.host+'/'+tori.conf.db.user);

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
