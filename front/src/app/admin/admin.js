angular.module( 'shopnowapp.admin', [
  'ui.router',
  'plusOne',
  'ngCookies',
  'ngLodash',
  'security'
])

.config(function config( $stateProvider, $cookiesProvider ) {
  $stateProvider
  .state( 'admin', {
    url: '/admin',
    views: {
      "main": {
        controller: 'AdminCtrl',
        templateUrl: 'admin/admin.tpl.html'
      },
      "submain@admin": {
        // controller: 'AdminPageCtrl',
        templateUrl: 'admin/admin.index.tpl.html'
      }
    },
    resolve: {
      authenticated: function($q, Authed) {
        var deferred = $q.defer();
        return Authed.isAuthed().then(function(response) {
          if(response) {
            deferred.resolve();
          } else {
            deferred.reject();
          }
          return deferred.promise;
        });
      }
    }
  })
  .state( 'admin.subscribers', {
    url: '/subscribers',
    resolve: {
    },
    views: {
      "submain@admin": {
        controller: 'AdminSubscribersCtrl',
        templateUrl: 'admin/admin.subscribers.tpl.html'
      }
    }
  })  
  .state( 'admin.stores', {
    url: '/stores',
    resolve: {
    },
    views: {
      "submain@admin": {
        controller: 'AdminStoresCtrl',
        templateUrl: 'admin/admin.stores.tpl.html'
      }
    }
  })  
  .state( 'admin.offers', {
    url: '/offers',
    resolve: {
    },
    views: {
      "submain@admin": {
        controller: 'AdminOffersCtrl',
        templateUrl: 'admin/admin.offers.tpl.html'
      }
    }
  })  

  ;
})

.controller( 'AdminCtrl', function AdminCtrl( $scope, $state, $http, $modal, $log, $location, Authed, API, notify, ngFB, $cookies) {
  $scope.app = {
    insights: {
      subscribers: 0,
      stores: 0,
      offers: 0,
      requests: 0
    }
  };

  $scope.search = {q: $location.search().q || ''};
  
  $scope.newPage = {
    facebook_id: '',
    q: ''
  };
  
  $scope.search_results = [];

  $scope.openApi = function(url) {
    top.location.href = window.API_URL + url;
  };

  $scope.goBack = function(where) {
    var url = '/admin/' + where + (where.indexOf('?') > -1 ? '&' : '?') + 'token=' + $scope.token;
    window.location.href = url;
  };
    
  $scope.getInsights = function() {
    API.countAdminAllSubscribers().then(function(result) {
      $scope.app.insights.subscribers = result.total;
    });
    API.countAdminAllPages().then(function(result) {
      $scope.app.insights.stores = result.total;
    });
    API.countAdminAllOffers().then(function(result) {
      $scope.app.insights.offers = result.total;
    });
    API.countAdminAllRequests().then(function(result) {
      $scope.app.insights.requests = result.total;
    });
  };
  
  $scope.searchFacebook = function() {
    ngFB.api({
      path: '/search',
      params: {q: $scope.newPage.q, type: 'page', limit: 5} 
    }).then(function(result) {
      $scope.search_results = result.data;
    });
  };
  
  $scope.addNewStore = function() {
    var modalInstance = $modal.open({
      animation: true,
      templateUrl: 'admin/modal.stores.add.tpl.html',
      controller: 'ModalInstanceCtrl',
      size: 'md',
      scope: $scope
      // resolve: {
      //   items: function () {
      //     return $scope.items;
      //   }
      // }
    });

    modalInstance.result.then(function (page) {
      // $scope.addedPage = page;
      $scope.getPages();
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };
  
  $scope.initNav = function() {
    if($scope.currentPath.indexOf('/subscribers') > -1) {
      $scope.tabName = 'subscribers';
    } else if($scope.currentPath.indexOf('/stores') > -1) {
      $scope.tabName = 'stores';
    } else if($scope.currentPath.indexOf('/offers') > -1) {
      $scope.tabName = 'offers';
    } else if($scope.currentPath.indexOf('/settings') > -1) {
      $scope.tabName = 'settings';
    } else if($scope.currentPath.indexOf('/upgrade') > -1) {
      $scope.tabName = 'upgrade';
    } else {
      $scope.tabName = '';
    }
  };
    
  $scope.getPages = function() {
    API.getAdminAllPages({after: 1}).then(function(result) {
      if(result.data) {
        $scope.pages = result.data;
      }
    });
  };
   
  $scope.init = function() {
    $scope.token = $location.search().token;
    $scope.app_token = $cookies.get('accessToken');
    
    $scope.initNav();
    $scope.getPages();
    $scope.getInsights();
  };

  $scope.init();
})

.controller( 'AdminSubscribersCtrl', function AdminSubscribersCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed) {
  $scope.getSubscribers = function() {
    API.getAdminAllSubscribers({after: 1, q: $scope.search.q}).then(function(result) {
      if(result.data) {
        $scope.subscribers = result.data;
      }
    });
  };
   
  $scope.init = function() {
    $scope.getSubscribers();
  };

  $scope.init();  
})

.controller( 'AdminStoresCtrl', function AdminStoresCtrl( $rootScope, $scope, $state, $stateParams, $location, $modal, API, Authed) {
  $scope.tagThisStore = function(store) {
    $scope.store = store;
    
    var modalInstance = $modal.open({
      animation: true,
      templateUrl: 'admin/modal.stores.tag.tpl.html',
      controller: 'TagThisStoreCtrl',
      size: 'md',
      scope: $scope
    });

    modalInstance.result.then(function (page) {
      $scope.getStores();
    }, function () {
    });
  };  
     
  $scope.getStores = function() {
    API.getAdminAllPages({after: 1, q: $scope.search.q}).then(function(result) {
      if(result.data) {
        $scope.stores = result.data;
      }
    });
  };
   
  $scope.init = function() {
    $scope.getStores();
  };

  $scope.init();  
})

.controller( 'TagThisOfferCtrl', function TagThisOfferCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed) {
  $scope.saveTag = function() {
    console.log('saved', $scope.offer);
    API.tagOffer($scope.offer).then(function() {
      alert('saved');
    });
    $scope.$close($scope.offer);
  };
  
  $scope.cancel = function() {
    $scope.$dismiss('cancel');
  };  
})

.controller( 'TagThisStoreCtrl', function TagThisStoreCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed) {
  $scope.updateStore = function() {
    console.log('saved', $scope.store);
    API.updateStore({page: {facebook_id: $scope.store.facebook_id, tags: $scope.store.tags, is_verified: $scope.store.is_verified}}).then(function() {
      alert('saved');
    });
    $scope.$close($scope.store);
  };
  
  $scope.cancel = function() {
    $scope.$dismiss('cancel');
  };  
})

.controller( 'AdminOffersCtrl', function AdminOffersCtrl( $rootScope, $scope, $state, $stateParams, $location, $modal, API, Authed) {
  $scope.getOffers = function() {
    API.getAdminAllOffers({after: 1, q: $scope.search.q}).then(function(result) {
      if(result.data) {
        $scope.offers = result.data;
      }
    });
  };
  
  $scope.tagThisOffer = function(offer) {
    $scope.offer = offer;
    $scope.offer.badge_color = $scope.offer.badge_color || '';
    
    var modalInstance = $modal.open({
      animation: true,
      templateUrl: 'admin/modal.offers.tag.tpl.html',
      controller: 'TagThisOfferCtrl',
      size: 'md',
      scope: $scope
    });

    modalInstance.result.then(function (page) {
      $scope.getOffers();
    }, function () {
    });
  };  
   
  $scope.init = function() {
    $scope.getOffers();
  };

  $scope.init();  
})

;


