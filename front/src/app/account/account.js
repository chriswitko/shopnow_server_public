angular.module( 'shopnowapp.account', [
  'ui.router',
  'plusOne',
  'ngCookies',
  'ngLodash',
  'security'
])

.config(function config( $stateProvider, $cookiesProvider ) {
  $stateProvider
  .state( 'account', {
    url: '/account',
    views: {
      "main": {
        controller: 'AccountCtrl',
        templateUrl: 'account/account.tpl.html'
      },
      "submain@account": {
        controller: 'AccountIndexCtrl',
        templateUrl: 'account/account.index.tpl.html'
      }
    },
    resolve: {
    }
  })
  .state( 'account.billing', {
    url: '/billing',
    resolve: {
    },
    views: {
      "submain@account": {
        controller: 'AccountBillingCtrl',
        templateUrl: 'account/account.billing.tpl.html'
      }
    }
  })  
  .state( 'account.invoices', {
    url: '/invoices',
    resolve: {
    },
    views: {
      "submain@account": {
        controller: 'AccountInvoicesCtrl',
        templateUrl: 'account/account.invoices.tpl.html'
      }
    }
  })  
  ;
})

.controller( 'AccountCtrl', function AccountCtrl( $scope, $state, $http, $modal, $log, $location, Authed, API, notify, ngFB, $cookies) {
  $scope.user = Authed.getCurrentUser();
  $scope.initNav = function() {
    if($scope.currentPath.indexOf('/invoices') > -1) {
      $scope.tabName = 'invoices';
    } else if ($scope.currentPath.indexOf('/billing') > -1) {
      $scope.tabName = 'billing';
    } else {
      $scope.tabName = '';
    }
  };
    
  $scope.getPages = function() {
    ngFB.api({
      path: '/me/accounts', 
    }).then(function(result) {
      $scope.pages = result.data;
    }).then(function(error) {
      window.location.href = '/business';
    });
  };
   
  $scope.init = function() {
    $scope.token = $location.search().token;
    
    $scope.initNav();
    // $scope.getPages();
  };

  $scope.init();
})

.controller( 'AccountIndexCtrl', function AccountIndexCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed) {
  $scope.init = function() {
    $scope.isUpdating = false;
    $scope.user = {};
    
    API.getMe().then(function(me) {
      // console.log('account', me);
      $scope.user = me;
    });
  };
  
  $scope.updateChanges = function() {
    $scope.isUpdating = true;
    API.saveMe({facebook_id: $scope.user.facebook_id, name: $scope.user.name, phone: $scope.user.phone, job_title: $scope.user.job_title}).then(function() {
      $scope.isUpdating = false;
    });
  };
  
  $scope.init();
})

.controller( 'AccountBillingCtrl', function AccountBillingCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed) {
  $scope.init = function() {
    $scope.isUpdating = false;
    $scope.user = {};
    
    API.getMe().then(function(me) {
      $scope.user = me;
    });
  };
  
  $scope.updateChanges = function() {
    $scope.isUpdating = true;
    API.saveMe({
      facebook_id: $scope.user.facebook_id,
      billing_address: {
        name: $scope.user.billing_address.name,
        addressLine1: $scope.user.billing_address.addressLine1,
        addressLine2: $scope.user.billing_address.addressLine2,
        zip: $scope.user.billing_address.zip,
        state: $scope.user.billing_address.state,
        city: $scope.user.billing_address.city,
        country: $scope.user.billing_address.country,
        vat: $scope.user.billing_address.vat
      }
      }).then(function() {
        API.validateVAT({
          facebook_id: $scope.user.facebook_id,
        }).then(function() {
          $scope.isUpdating = false;
        });
      });
      
  };
  
  $scope.init();
})

.controller( 'AccountInvoicesCtrl', function AccountInvoicesCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed) {
})

;


