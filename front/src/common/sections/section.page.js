/* global moment */
angular.module( 'ui.sections', ['nl2br', 'filters', 'ngCookies', 'stripe.checkout', 'validation', 'validation.rule' ] )

.directive( 'sectionLanding', function($q, $http, $state, $document, API, notify) {
  return {
    restrict: 'EA',
    scope: {
      logoUrl: '@',
      title: '@',
      subtitle: '@',
      links: '=',
      showExtraLink: '=?'
    },
    templateUrl: 'sections/section.landing.tpl.html',
    controller: ['$scope', function($scope) {
      $scope.previewImage = '/assets/img/mocks/' + (Math.floor(Math.random() * 2) + 1) + '.jpg';

      $scope.gotoAnchor = function(x) {
        
        var someElement = angular.element(document.getElementById(x));
        $document.scrollToElement(someElement, 30, 2000);
      };      
    }]
  };
})

.directive( 'sectionLandingBusiness', function($q, $http, $state, $document, API, notify) {
  return {
    restrict: 'EA',
    scope: {
      links: '=',
      showExtraLink: '=?'
    },
    templateUrl: 'sections/section.landing.business.tpl.html',
    controller: ['$scope', 'Authed', function($scope, Authed) {
      $scope.loggedIn = Authed.isAuthed();
      $scope.previewImage = '/assets/img/mocks/' + (Math.floor(Math.random() * 2) + 1) + '.jpg';

      $scope.login = function() {
        Authed.authorize('/manage', 'email,user_likes,user_friends,user_birthday,manage_pages');
      };
  
      $scope.gotoAnchor = function(x) {
        var someElement = angular.element(document.getElementById(x));
        $document.scrollToElement(someElement, 30, 2000);
      };      
    }]
  };
})

.directive( 'sectionCarousel', function($q, $http, $state, API, notify) {
  return {
    restrict: 'EA',
    scope: {
      slides: '=',
      title: '@',
      subtitle: '@'
    },
    templateUrl: 'sections/section.carousel.tpl.html',
    controller: ['$scope', function($scope) {
      $scope.slides = $scope.slides || [];
      
      $scope.currentSlide = 0; 
      
      $scope.slide = $scope.slides[$scope.currentSlide];
      
      $scope.gotoNextSlider = function(index) {
        $scope.currentSlide = index;
        $scope.slide = $scope.slides[index];
      };
    }]
  };
})

.directive( 'sectionFeatured', function($q, $http, $state, API, notify) {
  return {
    restrict: 'EA',
    scope: {
      title: '@',
      subtitle: '@'
    },
    templateUrl: 'sections/section.featured.tpl.html',
    controller: ['$scope', function($scope) {
    }]
  };
})

.directive( 'sectionCoupons', function($q, $http, $state, API, notify) {
  return {
    restrict: 'EA',
    scope: {
    },
    templateUrl: 'sections/section.coupons.tpl.html',
    controller: ['$scope', function($scope) {
    }]
  };
})

.directive( 'sectionDownload', function($q, $http, $state, API, notify) {
  return {
    restrict: 'EA',
    scope: true,
    templateUrl: 'sections/section.download.tpl.html',
    controller: ['$scope', function($scope) {
    }]
  };
})


;