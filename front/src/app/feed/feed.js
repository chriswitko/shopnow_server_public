angular.module( 'shopnowapp.feed', [
  'ui.router',
  'plusOne',
  'ui.bootstrap',
  'cards.discount',
  'security'
])

.config(function config( $stateProvider, $urlRouterProvider ) {

  var authenticated = ['$q', 'Facebook', function ($q, Facebook) {
    var deferred = $q.defer();

    Facebook.getLoginStatus(function(response) {
      if(response.status === 'connected') {
        console.log('connected');
        // $scope.loggedIn = true;
        deferred.resolve();
      } else {
        console.log('not connected');
        // $scope.loggedIn = false;
        deferred.reject('Not logged in');
      }
    });

    return deferred.promise;
  }];

  $stateProvider.state( 'feed', {
    url: '/feed',
    views: {
      "main": {
        controller: 'FeedCtrl',
        templateUrl: 'feed/feed.tpl.html'
      }
    },
    data:{ pageTitle: 'My Feed' },
    resolve: {
      authenticated: authenticated
    }
  });
})

.controller( 'FeedCtrl', function FeedController( $scope, $modal, $log, Facebook ) {
  $scope.getDiscount = function(size) {
    var modalInstance = $modal.open({
      animation: true,
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: size,
      resolve: {
        items: function () {
          return $scope.items;
        }
      }
    });

    modalInstance.result.then(function (selectedItem) {
      $scope.selected = selectedItem;
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

})

.controller('ModalInstanceCtrl', function ($scope, $modalInstance) {

  $scope.ok = function () {
    $modalInstance.close($scope.selected.item);
  };

  $scope.cancel = function () {
    $modalInstance.dismiss('cancel');
  };
});