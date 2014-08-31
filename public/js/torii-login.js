(function(){
  var app = angular.module('torii-login', ['ipCookie']);

  app.controller('LoginController', ['$http', '$log', 'ipCookie', '$window', function($http, $log, ipCookie, $window){
    
    this.error = null;
    this.success = null;
    
    var login = this;

    login.signIn = function(){
      $http.post('/auth/login', {
          username: login.username,
          password: login.password
      }).success(function(data, status){
        
        if(status == 200 && data.name == login.username && data.token){
          ipCookie('toriijs', data.name+'|'+data.token+'|'+data.id, { path: '/' });
          $window.location.href = '/admin';
        }else{
          login.error = 'Something went wrong during sign in, please retry.';
        }

      }).error(function(err, status){
        login.error = status +' '+err;
      });
    };

    login.signOut = function(){
      ipCookie.remove('toriijs');
      $window.location.href = '/auth/login';
    };

    login.registerUser = function(){

      if(login.password != login.retypepassword){
        login.error = 'Password mismatch';
      }else{
        $http.post('/auth/register', {
          username: login.username,
          password: login.password
        }).success(function(data, status){
          if(status == 200 && data.user == login.username){
            login.success = true;
            login.error = null;
          }else{
            login.error = data.message;            
          }

        }).error(function(err, status){
          login.error = status +' '+err;
        });
      }
    };


  }]);
})();
