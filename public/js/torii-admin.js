(function(){
  var app = angular.module('torii-admin', ['ipCookie']);

  app.controller('AdminController', function($scope, $http, ipCookie, $window, $log){
    
    $scope.user = {
      username: null,
      token: null,
      role: null
    };

    $scope.error = null;

    $scope.collections = null;

    if(!ipCookie('toriijs')){
      $window.location.href='/auth/login';
    }
    
    var splits = ipCookie('toriijs').toString().split('|');
    
    $scope.user.username = splits[0];
		$scope.user.token = splits[1];

    var user = this.user;
    var error = this.error;
    var collections = this.collections;

    // check user
    $http.post('/user/islogged',{
      username: $scope.user.username,
      token: $scope.user.token
    }).success(function(data, status){

      if( status == 200 && data.confirm != 'ok'){
        ipCookie.remove('toriijs');
        $window.location.href = '/auth/login';
			}
			
      if(data.role){
        $scope.user.role = data.role;
      }

    }).error(function(err, status){
      ipCookie.remove('toriijs');
      $window.location.href = '/auth/login';
    });

    // retrieve backend componets
    $http.post('/collection/list.json', {
      username: $scope.user.username,
      token: $scope.user.token
    }).success(function(data, status){
      $log.debug(data);
      if(status == 200 && data.aaData.length > 0){
        $scope.collections = data.aaData;
      }
      $log.debug($scope.collections);
    }).error(function(err, status){
      error = err;
    });

  });


})();
