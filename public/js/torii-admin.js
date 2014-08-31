(function(){
  var app = angular.module('torii-admin', ['ipCookie']);

  app.controller('AdminController',[ '$http', 'ipCookie', '$window', '$log' , function($http, ipCookie, $window, $log){
    
    this.user = {
      username: null,
      token: null,
      role: null
    };

    if(!ipCookie('toriijs')){
      $window.location.href='/auth/login';
    }
    
    var splits = ipCookie('toriijs').toString().split('|');
    
    this.user.username = splits[0];
		this.user.token = splits[1];

    var user = this.user;

    // check user
    $http.post('/user/islogged',{
      username: this.user.username,
      token: this.user.token
    }).success(function(data, status){

      if( status == 200 && data.confirm != 'ok'){
        ipCookie.remove('toriijs');
        $window.location.href = '/auth/login';
			}
			
      if(data.role){
        user.role = data.role;
      }

    }).error(function(err, status){
      ipCookie.remove('toriijs');
      $window.location.href = '/auth/login';
    });

    // retrieve backend componets
    $http.post('/collection/list.json', {
      username: this.user.username,
      token: this.user.token
    }).success(function(data, status){
    }).error(function(err, status){
    });

  }]);

})();
