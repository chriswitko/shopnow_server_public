var current_user;
var access_token;
var facebook_token;
var is_admin;

angular.module( 'shopnowapp', [
  'templates-app',
  'templates-common',
  'shopnowapp.home',
  'shopnowapp.help',
  'shopnowapp.privacy',
  'shopnowapp.terms',
  'shopnowapp.about',
  'shopnowapp.feed',
  'shopnowapp.explore',
  'shopnowapp.about',
  'shopnowapp.download',
  'shopnowapp.business',
  'shopnowapp.manage',
  'shopnowapp.admin',
  'shopnowapp.account',
  'shopnowapp.pages',
  'ui.bootstrap',
  'ui.bootstrap.tooltip',
  'shopnow',
  'ui.router',
  'ngOpenFB',
  'ngSanitize',
  'ui',
  'ui.sections',
  'ui.nav',
  'security',
  'ngCookies',
  'lr.upload',
  'Fundoo.Directives.AutoSave',
  'LocalStorageModule',
  'ui.mask',
  'stripe.checkout',
  'angularMoment',
  'ngImage',
  'validation',
  'cgNotify',
  'duScroll',
  'truncate',
  'chart.js',
  'ngLodash',
  'flow',
  'slick'
])

.config( function myAppConfig ( $provide, $stateProvider, $urlRouterProvider, $locationProvider, $httpProvider, $sceDelegateProvider, StripeCheckoutProvider, $validationProvider, ChartJsProvider ) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });

  $validationProvider.setErrorHTML(function (msg) {
    return  "<label class=\"control-label has-error\">" + msg + "</label>";
  })
  .setExpression({
      range: function (value, scope, element, attrs) {
          if (value >= parseInt(attrs.min, 10)) { // && value <= parseInt(attrs.max, 10)
              return value;
          }
      }
  })
  .setDefaultMsg({
      range: {
          error: 'Number should be min 5',
          success: 'good'
      }
  });

  ChartJsProvider.setOptions({
    colours: ['#2196F3', '#FF4081', '#424242'],
    responsive: true,
    bezierCurve : false,
    datasetFill: false
  });
    
  // angular.extend($validationProvider, {
  //     validCallback: function (element){
  //         $(element).parents('.form-group:first').removeClass('has-error');
  //     },
  //     invalidCallback: function (element) {
  //         $(element).parents('.form-group:first').addClass('has-error');
  //     }
  // });

  // $provide.decorator('$state', function($delegate) {
  //   var originalTransitionTo = $delegate.transitionTo;
  //   $delegate.transitionTo = function(to, toParams, options) {
  //     return originalTransitionTo(to, toParams, angular.extend({
  //       reload: true
  //     }, options));
  //   };
  //   return $delegate;
  // });

  StripeCheckoutProvider.defaults({
    key: ""
  });

  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    'self',
    // Allow loading from our assets domain.  Notice the difference between * and **.
    'https://scontent.cdninstagram.com/**'
  ]);

  // $urlRouterProvider.otherwise( '/?ref=404' );

  $urlRouterProvider.otherwise(function($injector, $location){
    window.location.href = '/?ref=404';
  });
  // $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';


  // FacebookProvider.setSdkVersion('v2.5');
  // FacebookProvider.init(window.FACEBOOK_CLIENTID);

  $httpProvider.interceptors.push('APIInterceptor');
  $httpProvider.interceptors.push('AuthInterceptor');
})

.run( function run ($rootScope, $log, $state, ngFB, StripeCheckout) {
  ngFB.init({appId: window.FACEBOOK_CLIENTID});

  StripeCheckout.defaults({
    opened: function() {
      $log.debug("Stripe Checkout opened");
    },
    closed: function() {
      $log.debug("Stripe Checkout closed");
    }
  });

  $rootScope.$state = $state;
})

.controller( 'AppCtrl', function AppCtrl ( $scope, $state, $stateParams, $location, ngFB) {
  $scope.openChat = false;
  
  $scope.gotoMessenger = function() {
    window.location.href = 'https://m.me/getshopnow';
  };
  
  $scope.toggleChat = function() {
    $scope.openChat = !$scope.openChat;
    setTimeout(function() {
      ngFB.init({appId: window.FACEBOOK_CLIENTID});
    }, 0);
  };

  $scope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
    window.location.href = '/business';
  });
    
  $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
    var currentPath = $location.$$path.replace('/', '');
    $scope.currentPath = currentPath;
    $scope.isManageView = currentPath.indexOf('manage') > -1 || currentPath.indexOf('admin') > -1 || currentPath.indexOf('account') > -1;
  });
})

.service('APIInterceptor', function($rootScope, $cookies, $timeout) {
  var service = this;

  service.request = function(config) {
    var access_token = $cookies.get('accessToken') ? $cookies.get('accessToken') : null;

    if (access_token) {
      config.headers['x-access-token'] = access_token;
    }
    return config;
  };
  
  service.response = function(response) {
    if(response.config.method === 'PUT') {
      // return $timeout(function() {
        return response;
      // }, 2000);    
    } else {
      return response;
    }
  };

  service.responseError = function(response) {
    if (response.status === 401) {
      $rootScope.$broadcast('unauthorized');
    }
    return response;
  };
})
;

