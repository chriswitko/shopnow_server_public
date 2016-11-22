angular.module( 'shopnowapp.privacy', [
  'ui.router',
  'ui.bootstrap'
])

.config(function config( $stateProvider ) {
  $stateProvider.state( 'privacy', {
    url: '/privacy',
    views: {
      "main": {
        controller: 'PrivacyCtrl',
        templateUrl: 'privacy/privacy.tpl.html'
      }
    },
    data:{ pageTitle: 'Privacy' }
  });
})

.controller( 'PrivacyCtrl', function PrivacyCtrl( $scope ) {

})

;
