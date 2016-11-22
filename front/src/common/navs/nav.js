angular.module( 'ui.nav', ['nl2br', 'filters'] )

.directive( 'nav', function($http, $state, $window, $location, $cookies, Authed) {
  return {
    restrict: 'EA',
    scope: {},
    templateUrl: 'navs/nav.tpl.html',
    link: function (scope, element, attrs) {
      if(!scope.returnUrl) {
        scope.returnUrl = '/';
      }
      scope.token = $location.search().token;
      scope.isAuthed = Authed.isAuthed();
      scope.isAdmin = $cookies.get('isAdmin') === 'true' ? true : false;
      // console.log('isAdmin:nav', $cookies.get('isAdmin'));
      scope.user = Authed.getCurrentUser();
      var currentPath = $location.$$path;
      // console.log('currentPath', currentPath);
      scope.currentPath = currentPath;

      if(scope.currentPath.indexOf('/manage') > -1) {
        scope.sectionName = 'manage';
      } else if(scope.currentPath.indexOf('/account') > -1) {
        scope.sectionName = 'account';
      } else if(scope.currentPath.indexOf('/admin') > -1) {
        scope.sectionName = 'admin';
      } else {
        scope.sectionName = '';
      }
      
      // console.log('scope.sectionName', scope.sectionName);

      scope.logout = function() {
        Authed.logout(function() {
          // $window.location.reload(true);
          $window.location.href = '/business?ts=' + new Date().getTime();
          // $state.go('business');
        });
      };
    }
  };
})

.directive( 'navBrand', function($http, $state, $window, Authed) {
  return {
    restrict: 'EA',
    scope: {
      theme: '@',
      returnUrl: '@',
      page: '='
    },
    templateUrl: 'navs/nav-brand.tpl.html',
    link: function (scope, element, attrs) {
      if(!scope.returnUrl) {
        scope.returnUrl = '/';
      }
      scope.isAuthed = Authed.isAuthed();

      scope.logout = function() {
        Authed.logout(function() {
          // $window.location.reload(true);
          // window.location = '/business?ts=' + new Date().getTime();
          $state.go('business');
        });
      };
    }
  };
})

.directive( 'navHome', function($http, $state, $window, Authed) {
  return {
    restrict: 'EA',
    scope: {
    },
    templateUrl: 'navs/nav-home.tpl.html',
    link: function (scope, element, attrs) {
    }
  };
})
;

