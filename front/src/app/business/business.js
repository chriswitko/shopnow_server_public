angular.module( 'shopnowapp.business', [
  'ui.router',
  'plusOne',
  'ngCookies'
])

.config(function config( $stateProvider, $cookiesProvider ) {
  $stateProvider.state( 'business', {
    url: '/business',
    views: {
      "main": {
        controller: 'BusinessCtrl',
        templateUrl: 'business/business.tpl.html'
      }
    },
    data:{
      pageTitle: 'ShopNow for Business',
      userID: $cookiesProvider['userID']
    }
  });
})

.controller( 'BusinessCtrl', function HomeController( $scope, $state, $document, Authed ) {
  $document.scrollTop(0, 2000).then(function() {});
  
  if(window.fbq) {
    window.fbq('track', 'ViewContent');
  }
  
  $scope.isAuthed = Authed.isAuthed();

  $scope.login = function() {
    if(window.fbq) {
      window.fbq('track', 'Lead');
    }
    Authed.authorize('/manage', 'email,user_likes,user_friends,user_birthday,manage_pages');
  };
});
