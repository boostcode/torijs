(function(){
  var app = angular.module('torii-admin', ['ipCookie']);

  app.controller('AdminController', ['$scope', '$http', 'ipCookie', '$window', '$log' , function($scope, $http, ipCookie, $window, $log){
    
    this.data = {
      user: {
        username: null,
        token: null,
        role: null
      },
      error: null
    };
    
    var data = this.data;
    var user = this.data.user;
    var error = this.data.error;
    var colls = this.data.colls;


    if(!ipCookie('toriijs')){
      $window.location.href='/auth/login';
    }
    
    var splits = ipCookie('toriijs').toString().split('|');
    
    user.username = splits[0];
		user.token = splits[1];

    
    // check user
    $http.post('/user/islogged',{
      username: user.username,
      token: user.token
    }).success(function(data, status){

      if( status == 200 && data.confirm != 'ok'){
        ipCookie.remove('toriijs');
        $window.location.href = '/auth/login';
			}
			
      if(data.role){
        user.user.role = data.role;
      }

      user.test = 'asd';

    }).error(function(err, status){
      ipCookie.remove('toriijs');
      $window.location.href = '/auth/login';
    });

    // check user
    $http.post('/collection/list.json',{
      username: user.username,
      token: user.token
    }).success(function(d, status){
       data.colls = d.aaData;
    }).error(function(err, status){
    });


  
  }]);

})();
