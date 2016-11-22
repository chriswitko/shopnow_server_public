angular.module( 'shopnowapp.download', [
  'ui.router',
  'plusOne',
  'ngCookies'
])

.config(function config( $stateProvider ) {
  $stateProvider.state( 'download', {
    url: '/download',
    views: {
      "main": {
        controller: 'DownloadCtrl',
        templateUrl: 'download/download.tpl.html'
      }
    },
    data:{ pageTitle: 'Download ShopNow' }
  });
})

.controller( 'DownloadCtrl', function HomeController( $scope, $state ) {

});
