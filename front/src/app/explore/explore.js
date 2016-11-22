angular.module( 'shopnowapp.explore', [
  'ui.router',
  'plusOne',
  'cards.post',
  'cards.page',
  'ui.bootstrap'
])

.config(function config( $stateProvider ) {
  $stateProvider.state( 'explore', {
    url: '/explore',
    views: {
      "main": {
        controller: 'ExploreCtrl',
        templateUrl: 'explore/explore.tpl.html'
      }
    },
    data:{ pageTitle: 'Explore' }
  });
})

.controller( 'ExploreCtrl', function ExploreController( $scope, $modal, $log, Facebook ) {
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