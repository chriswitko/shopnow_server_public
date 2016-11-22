angular.module( 'shopnowapp.manage', [
  'ui.router',
  'plusOne',
  'ngCookies',
  'ngLodash',
  'security',
  'stripe.checkout'
])

.config(function config( $stateProvider, $cookiesProvider, StripeCheckoutProvider ) {
  $stateProvider
  .state( 'manage', {
    url: '/manage',
    views: {
      "main": {
        controller: 'ManageCtrl',
        templateUrl: 'manage/manage.tpl.html'
      },
      "submain@manage": {
        // controller: 'ManageCustomersCtrl',
        templateUrl: 'manage/manage.pages.tpl.html'
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
      },
      pages: function($q, ngFB) {
        return ngFB.api({
          path: '/me/accounts', 
        }).then(function(result) {
          return result.data;
        });
      }
    }
  })
  .state( 'manage.page', {
    url: '/:pageID',
    resolve: {
      page: ['$q', '$stateParams', '$location', 'API', function($q, $stateParams, $location, API) {
        var deferred = $q.defer();
        API.authPage({id: $stateParams.pageID, access_token: $location.search().token})
          .then(function(response) {
            API.getPage($stateParams.pageID)
              .then(function(page) {
                deferred.resolve(page);
              })
              .catch(function() {
                deferred.reject();                
              });
          });
        return deferred.promise;
      }]
    },
    views: {
      "submain@manage": {
        controller: 'ManagePageCtrl',
        templateUrl: 'manage/manage.index.tpl.html'
      }
    }
  })
  .state( 'manage.page.subscribers', {
    url: '/subscribers',
    resolve: {
    },
    views: {
      "submain@manage": {
        controller: 'ManageSubscribersCtrl',
        templateUrl: 'manage/manage.subscribers.tpl.html'
      }
    }
  })  
  .state( 'manage.page.requests', {
    url: '/requests',
    resolve: {
    },
    views: {
      "submain@manage": {
        controller: 'ManageRequestsCtrl',
        templateUrl: 'manage/manage.requests.tpl.html'
      }
    }
  })  
  .state( 'manage.page.offers', {
    url: '/offers',
    resolve: {
    },
    views: {
      "submain@manage": {
        controller: 'ManageOffersCtrl',
        templateUrl: 'manage/manage.offers.tpl.html'
      }
    }
  })  
  .state( 'manage.page.offers.create', {
    url: '/create',
    resolve: {
    },
    views: {
      "submain@manage": {
        controller: 'ManageOffersCreateCtrl',
        templateUrl: 'manage/manage.offers.create.tpl.html'
      }
    },
    data: {
      editMode: 'new'
    }
  })    
  .state( 'manage.page.offers.edit', {
    url: '/edit',
    resolve: {
    },
    views: {
      "submain@manage": {
        controller: 'ManageOffersCreateCtrl',
        templateUrl: 'manage/manage.offers.create.tpl.html'
      }
    },
    data: {
      editMode: 'edit'
    }
  })    
  .state( 'manage.page.upgrade', {
    url: '/upgrade',
    resolve: {
      stripe: StripeCheckoutProvider.load
    },
    views: {
      "submain@manage": {
        controller: 'ManageUpgradeCtrl',
        templateUrl: 'manage/manage.upgrade.tpl.html'
      }
    }
  })  
  .state( 'manage.page.settings', {
    url: '/settings',
    resolve: {
    },
    views: {
      "submain@manage": {
        controller: 'ManagePageCtrl',
        templateUrl: 'manage/manage.settings.tpl.html'
      }
    }
  })  
  .state( 'manage.page.settings.basic', {
    url: '/basic',
    resolve: {
    },
    views: {
      "submain@manage": {
        controller: 'ManageSettingsBasicCtrl',
        templateUrl: 'manage/manage.settings.basic.tpl.html'
      }
    }
  })  
  .state( 'manage.page.settings.admin', {
    url: '/admin',
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
    },
    views: {
      "submain@manage": {
        controller: 'ManageSettingsAdminCtrl',
        templateUrl: 'manage/manage.settings.admin.tpl.html'
      }
    }
  })  
  ;
})

.controller( 'ManageCtrl', function ManageCtrl( $scope, $state, $http, $modal, $log, $location, $window, Authed, API, notify, ngFB, $cookies, pages) {
  if(window.fbq) {
    window.fbq('track', 'CompleteRegistration');
  }
  
  $scope.isAdmin = $cookies.get('isAdmin');

  $scope.goBack = function(page, where) {
    var url = '/manage/' + page.facebook_id + '/' + where + (where.indexOf('?') > -1 ? '&' : '?') + 'token=' + $scope.token;
    window.location.href = url;
  };
      
  $scope.share = function() {
    $window.FB.ui({
      method: 'share',
      href: 'https://shopnowapp.com',
    }, function(response){});        
  };   

  $scope.initNav = function() {
    if($scope.currentPath.indexOf('/subscribers') > -1) {
      $scope.tabName = 'subscribers';
    } else if($scope.currentPath.indexOf('/requests') > -1) {
      $scope.tabName = 'requests';
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
    ngFB.api({
      path: '/me/accounts', 
    }).then(function(result) {
      $scope.pages = result.data;
    }).then(function(error) {
      window.location.href = '/business';
    });
  };

  $scope.init = function() {
    $scope.pages = pages || [];
    $scope.token = $location.search().token;
    
    $scope.initNav();
    // $scope.getPages();
  };

  $scope.init();
})

.controller( 'ManageOffersCreateCtrl', function ManageOffersCreateCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed, page) {
  $scope.updatePicture = function($file, $message, $flow) {
    var file = JSON.parse($message);
    if(file && file.url) {
      $scope.offer.picture = file.url;
    }
  }; 
  
  $scope.setGender = function() {
    if($scope.helper.gender === 'male') {
      return ['male', 'unknown'];
    } else if($scope.helper.gender === 'female') {
      return ['female', 'unknown'];
    } else {
      return ['male', 'female', 'unknown'];
    }
  };
  
  $scope.updateGender = function() {
    $scope.offer.targeting.gender = $scope.setGender();
  };
  
  $scope.getGender = function() {
    return $scope.helper.gender;
  };

  $scope.sendOffer = function() {
    $scope.isUploading = false;
    $scope.isSending = true;
    $scope.offer.status = 'paid';
    API.sendOffer($scope.offer).then(function() {
      $scope.isSending = false;
      $scope.goBack(page, 'offers');
    });
  };
  
  $scope.init = function() {
    $scope.isUploading = false;
    $scope.isSending = false;
    $scope.editMode = $state.current.data.editMode || 'new';
    $scope.page = page;

    $scope.helper = {gender: 'all'};

    $scope.offer = {
      category: $location.search().category || 'standard_offer',
      title: '',
      messag: '',
      link: $scope.page.link,
      picture: '',
      timezone: 'Europe/London',
      claim_limit: 100,
      redemption_code: '',
      user_id: Authed.getCurrentUser(),
      page_id: $scope.page.facebook_id,
      targeting: {gender: $scope.setGender(), age_from: 16, age_to: 100, mode: 'custom'},
      status: 'draft',
      is_auto: false,
      valid_days: 1
    };
    
    if($scope.editMode === 'edit') {
      API.getOffer($location.search().offer_id).then(function(offer) {
        $scope.offer = offer;
      });
    }
  };
    
  $scope.init();
})

.controller( 'ManageRequestsCtrl', function ManageRequestsCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed, page) {
  $scope.loadRequests = function() {
    API.getRequestsFromPage({facebook_id: $scope.page.facebook_id}).then(function(result) {
      if(result.subscribers_requests) {
        $scope.requests = result.subscribers_requests.data;
      }
    });
  };
  
  $scope.init = function() {
    $scope.page = page;
    $scope.requests = [];
    
    $scope.loadRequests();    
  };

  $scope.init();  
})

.controller( 'ManageSettingsBasicCtrl', function ManageSettingsBasicCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed, page) {
  $scope.updatePageSettings = function() {
    $scope.isUpdating = true;
    API.updatePageSettings({
      facebook_id: $scope.page.facebook_id,
      name: $scope.page.name,
      link: $scope.page.link
      }).then(function() {
        $scope.isUpdating = false;
      });
  };
  
  $scope.init = function() {
    $scope.page = page;
  };

  $scope.init();  
})

.controller( 'ManageSettingsAdminCtrl', function ManageSettingsAdminCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed, page) {
  $scope.updatePageSettings = function() {
    $scope.isUpdating = true;
    API.updatePageSettings({
      facebook_id: $scope.page.facebook_id,
      is_enabled: $scope.page.is_enabled,
      is_verified: $scope.page.is_verified,
      is_synched: $scope.page.is_synched,
      is_activated: $scope.page.is_activated,
      plan: $scope.page.plan,
      }).then(function() {
        $scope.isUpdating = false;
      });
  };
  
  $scope.init = function() {
    $scope.page = page;
  };

  $scope.init();  
})

.controller( 'ManageSubscribersCtrl', function ManageSubscribersCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed, page) {
  $scope.loadSubscribers = function() {
    API.getSubscribersFromPage({facebook_id: $scope.page.facebook_id}).then(function(result) {
      if(result.subscribers) {
        $scope.subscribers = result.subscribers.data;
      }
    });
  };
  
  $scope.init = function() {
    $scope.page = page;
    $scope.subscribers = [];
    
    $scope.loadSubscribers();    
  };

  $scope.init();  
})

.controller( 'ManageOffersCtrl', function ManageOffersCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed, page) {
  $scope.getOffer = function(offer_id) {
    API.getOffer(offer_id).then(function(result) {
      if(result._id) {
        $scope.moments[offer_id] = result;
      }
    });
  };
  
  $scope.loadOffers = function() {
    API.getOffersFromPage({facebook_id: $scope.page.facebook_id}).then(function(result) {
      if(result.all_offers) {
        $scope.offers = result.all_offers.data;
      }
    });
    if($scope.page.active_moments) {
      if($scope.page.active_moments.welcome_moment) {
        $scope.getOffer($scope.page.active_moments.welcome_moment);
      }
      if($scope.page.active_moments.birthday_moment) {
        $scope.getOffer($scope.page.active_moments.birthday_moment);
      }
    }
  };
  
  $scope.deleteOffer = function(offer) {
    API.deleteOffer(offer._id).then(function(result) {
      $scope.loadOffers();    
    });
  };
  
  $scope.init = function() {
    $scope.page = page;
    $scope.offers = [];
    $scope.moments = [];
    
    $scope.loadOffers();    
  };

  $scope.init();  
})

.controller( 'ManageUpgradeCtrl', function ManageUpgradeCtrl( $rootScope, $scope, $state, $stateParams, $location, StripeCheckout, API, Authed, page) {
  var handler = StripeCheckout.configure({
      token: function(token, args) {
        // console.debug("Got stripe token: " + token.id);
      }
  });

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
        $scope.isUpdating = false;
      });
  };

  
  $scope.cancelPlan = function(page) {
    API.cancelPlan(page).then(function(result) {
      $scope.goBack($scope.page, 'upgrade');
    });
  };

  $scope.upgradePlan = function(page, plan) {
    API.getMe().then(function(me) {
      if(!me.billing_address.country) {
        window.location.href = '/account?token=' + $scope.token;
        return;
      }
      
      var amount = 19.00;
      if(!me.customer_valid_vat_number || me.billing_address.country === 'GB') {
        amount = amount * 1.20;
      }

      var plans = [];
          plans['free'] = {name: 'ShopNow for Free', price: 0, package: 'free'};
          plans['basic'] = {name: 'ShopNow Basic (Monthly subscription)', price: amount, package: 'basic'};
          // we need to create basic_uk, basic_world (with and without vat)
      
      var price = plans[plan].price;
     
      var options = {
        name: 'ShopNow',
        image: 'https://stripe.com/img/documentation/checkout/marketplace.png',
        description: plans[plan].name,
        email: me.email || '',
        currency: 'GBP',
        amount: price * 100,
        panelLabel: 'Subscribe',
        label: 'Subscribe',
        allowRememberMe: false
      };

      handler.open(options)
        .then(function(result) {
          if(result[0].id) {
            var billing = {
              metadata: {
                country: me.billing_address.country,
                vat_id: me.billing_address.vat,
                customer_valid_vat_number: me.customer_valid_vat_number,
                price: price,
                currency: 'GBP',
                page_id: $scope.page.facebook_id,
                user_id: me.facebook_id,
                package: plans[plan].package
              },
              stripe_token: result[0].id,
              plan: plan,
              email: me.email
            };
                    
            API.pay(billing).then(function(result) {
              $scope.goBack($scope.page, 'upgrade');
            });
          } else {
            alert('Payment Error');
          }
        },function() {
          // alert("Stripe Checkout closed without making a sale :(");
        });

    });

  };

  $scope.init = function() {
    $scope.page = page;
  };

  $scope.init();  
})

.controller( 'ManagePageCtrl', function ManagePageCtrl( $rootScope, $scope, $state, $stateParams, $location, API, Authed, page) {

  $scope.init = function() {
    $scope.page = page;
  };

  $scope.init();  
})

.directive('pageSettingsActions', function ($state) {
  return {
    restrict: 'EA',
    scope: {
      page: '='
    },
    templateUrl: 'manage/component.page.settings.actions.tpl.html',
    controller: ['$scope', '$window', 'API', '$location', function($scope, $window, API, $location) {
      $scope.token = $location.search().token;
      
      $scope.goBack = function(page, where) {
        var url = '/manage/' + page.facebook_id + '/' + where + (where.indexOf('?') > -1 ? '&' : '?') + 'token=' + $scope.token;
        window.location.href = url;
      };
     
    }]
  };
})

.directive('pageAdminActions', function ($state) {
  return {
    restrict: 'EA',
    scope: {
      page: '='
    },
    templateUrl: 'manage/component.page.admin.actions.tpl.html',
    controller: ['$scope', '$window', 'API', '$location', function($scope, $window, API, $location) {
      $scope.token = $location.search().token;
      
      $scope.goBack = function(page, where) {
        var url = '/manage/' + page.facebook_id + '/' + where + (where.indexOf('?') > -1 ? '&' : '?') + 'token=' + $scope.token;
        window.location.href = url;
      };
     
    }]
  };
})

.directive('pageStats', function ($state, Insights) {
  return {
    restrict: 'EA',
    scope: {
      page: '='
    },
    templateUrl: 'manage/component.page.stats.tpl.html',
    controller: ['$scope', '$timeout', 'API', function($scope, $timeout, API) {
      $scope.isCancelConfirmed = false;
      $scope.isLoading = true;

      $scope.labels = [];
      $scope.series = ['Opens', 'Clicks'];
      $scope.data = [];
      
      var cup = [];
      var key;

      $scope.$watch('ad', function() {
        $scope.init();
      }, true);
                    
      $scope.init = function() {
        $scope.data = [];
        var start = '2016-01-01';
        var end = '2016-12-31';

        Insights.report({start: start, end: end, n: 'page', i: $scope.page.facebook_id, e: 'view'}).then(function(report) {
          console.log('report', report);
          if(report.data && report.data.view.all.data.length === 1) {
            // only one day to show
            _.map(report.data.view.all.data[0].hourly, function(value, key) {
              cup[key] = {label: key, opens: value, clicks: 0};
            }); 
            
            Insights.report({start: start, end: end, n: 'page', i: $scope.page._facebook_idid, e: 'click'}).then(function(report) {
              if(report.data && report.data.click.all.data.length) {
                _.map(report.data.click.all.data[0].hourly, function(value, key) {
                  if(key in cup) {
                    cup[key].clicks = value; 
                  } else {
                    cup[key] = {label: key, opens: 0, clicks: value};
                  }
                }); 
              }
              $scope.labels = _.map(cup, function(row) { return row.label; });
              $scope.data[0] = _.map(cup, function(row) { return row.opens; });
              $scope.data[1] = _.map(cup, function(row) { return row.clicks; });
              $scope.isLoading = false;
            });
          } else if(report.data && report.data.view.all.data.length > 1) {
            // day by day
            _.map(report.data.view.all.data, function(day) {
              key = moment(day.metadata.date).format('DD/MM/YYYY');
              cup[key] = {label: key, opens: day.total, clicks: 0};
            }); 

            Insights.report({start: start, end: end, n: 'page', i: $scope.page.facebook_id, e: 'click'}).then(function(report) {
              if(report.data.click.all.data.length) {
                _.map(report.data.click.all.data, function(day) {
                  key = moment(day.metadata.date).format('DD/MM/YYYY');
                  if(key in cup) {
                    cup[key].clicks = day.total; 
                  } else {
                    cup[key] = {label: key, opens: 0, clicks: day.total};
                  }
                }); 
              }
              
              var tmp = cup.sortBy('label');
              tmp = _.mapValues(tmp, function(val, row) {
                return val;
              });
              $scope.labels = _.map(tmp, function(row) { return row.label; });
              $scope.data[0] = _.map(tmp, function(row) { return row.opens; });
              $scope.data[1] = _.map(tmp, function(row) { return row.clicks; });
              $scope.isLoading = false;
            });
          } else {
            $scope.isLoading = false;
          }
        });
      };

      $scope.onClick = function (points, evt) {
        console.log(points, evt);
      };
      
      $scope.init();      
    }]
  };
})
;


(function(){
  if (typeof Object.defineProperty === 'function'){
    try{Object.defineProperty(Array.prototype,'sortByKey',{value:sortByKey}); }catch(e){}
  }
  if (!Array.prototype.sortByKey) {
    Array.prototype.sortByKey = sortByKey;
  }

  if (typeof Object.defineProperty === 'function'){
    try{Object.defineProperty(Array.prototype,'sortBy',{value:sb}); }catch(e){}
  }
  if (!Array.prototype.sortBy) {
    Array.prototype.sortBy = sb;
  }

  function sb(f){
    var i, len;
    for (i=this.length;i;){
      var o = this[--i];
      this[i] = [].concat(f.call(o,o,i),o);
    }
    this.sort(function(a,b){
      for (i=0,len=a.length;i<len;++i){
        if (a[i]!=b[i]) {
          return a[i]<b[i]?-1:1;
        }
      }
      return 0;
    });
    for (i=this.length;i;){
      this[--i]=this[i][this[i].length-1];
    }
    return this;
  }
  
  function sortByKey(key) {
      return this.sort(function(a, b) {
          var x = a[key]; var y = b[key];
          // return ((x < y) ? -1 : ((x > y) ? 1 : 0));
          return x - y;
      });
  }  
})();