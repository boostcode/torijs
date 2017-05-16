(function(){
  var app = angular.module('user', ['ipCookie', 'ngTable']);

  app.controller('UserController', function($scope, $http, $log, ipCookie, $window, $timeout, ngTableParams){
    
    var splits = ipCookie('torijs').toString().split('|');
    
    var user = {};
    user.username = splits[0];
		user.token = splits[1];


    $scope.userListTable = new ngTableParams({
      page: 1,
      count: 10,
      sorting: {
        username: 'asc'
      }
    },{
      total: 0,
      getData: function($defer, params){
        
        $log.debug(params.url());

        // check user
        $http.post('/user/list.json',{
          username: user.username,
          token: user.token,
          filter: params.filter(),
          sorting: params.sorting(),
          page: params.page(),
          count: params.count()
        }).success(function(data, status){

        if( status == 200 && !data.result ){
          ipCookie.remove('torijs');
          $window.location.href = '/auth/login';
			  }
        
        params.total(data.total);
        $defer.resolve(data.result);

      }).error(function(err, status){
        ipCookie.remove('torijs');
        $window.location.href = '/auth/login';
      });

      }
    });

  });

  
  app.directive('loadingContainer', function () {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element, attrs) {
            var loadingLayer = angular.element('<div class="loading"></div>');
            element.append(loadingLayer);
            element.addClass('loading-container');
            scope.$watch(attrs.loadingContainer, function(value) {
                loadingLayer.toggleClass('ng-hide', !value);
            });
        }
    };
  });

})();
