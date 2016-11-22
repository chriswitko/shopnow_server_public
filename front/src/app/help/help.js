angular.module( 'shopnowapp.help', [
  'ui.router',
  'ui.bootstrap'
])

.config(function config( $stateProvider ) {
  $stateProvider.state( 'help', {
    url: '/help',
    views: {
      "main": {
        controller: 'HelpCtrl',
        templateUrl: 'help/help.tpl.html'
      }
    },
    data:{ pageTitle: 'Help' }
  });
})

.controller( 'HelpCtrl', function HelpCtrl( $scope ) {

})

;
