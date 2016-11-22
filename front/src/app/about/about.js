angular.module( 'shopnowapp.about', [
  'ui.router',
  'ui.bootstrap'
])

.config(function config( $stateProvider ) {
  $stateProvider.state( 'about', {
    url: '/about',
    views: {
      "main": {
        controller: 'AboutCtrl',
        templateUrl: 'about/about.tpl.html'
      }
    },
    data:{ pageTitle: 'About ShopNow' }
  });
})

.controller( 'AboutCtrl', function AboutCtrl( $scope ) {
})

;
