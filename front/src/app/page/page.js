angular.module( 'shopnowapp.pages', [
  'ui.router',
  'plusOne',
  'ngCookies'
])

.config(function config( $stateProvider, $cookiesProvider ) {
  $stateProvider.state( 'pages', {
    url: '/add/:id',
    views: {
      "main": {
        controller: 'PagesCtrl',
        templateUrl: 'page/page.tpl.html'
      }
    },
    data:{
      // page: window.BRAND
      // pageTitle: 'DOWNLOAD APP AND GET YOUR DISCOUNT NOW!',
      // userID: $cookiesProvider['userID']
    }
  });
})

.controller( 'PagesCtrl', function PagesController( $scope, $state, $stateParams, Authed ) {
  $scope.username = $stateParams.id;

  $scope.page = window.BRAND;  

  $scope.login = function() {
    Authed.authorize('/' + $scope.username, 'email,user_likes,user_location,user_friends');
  };
});
