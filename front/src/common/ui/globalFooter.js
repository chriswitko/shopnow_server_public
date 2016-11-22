angular.module( 'ui', ['nl2br', 'filters'] )

.directive( 'globalFooter', function($http) {
  return {
    restrict: 'EA',
    scope: {
      theme: '@'
    },
    templateUrl: 'ui/globalFooter.tpl.html',
    link: function (scope, element, attrs) {

    }
  };
})

.directive('btnLoading',function () {
    return {
    restrict: 'EA',
        link:function (scope, element, attrs) {
          // console.log('hello btnLoading');
            scope.$watch(
                function () {
                    return scope.$eval(attrs.btnLoading);
                },
                function (value) {
                    if(value) {
                        if (!attrs.hasOwnProperty('ngDisabled')) {
                            element.addClass('disabled').attr('disabled', 'disabled');
                        }

                        element.data('resetText', element.html());
                        element.html(attrs.loadingText);
                    } else {
                        if (!attrs.hasOwnProperty('ngDisabled')) {
                            element.removeClass('disabled').removeAttr('disabled');
                        }

                        element.html(element.data('resetText'));
                    }
                }
            );
        }
    };
})

.directive('midImg', [function () {
    return {
        restrict: 'EA',
        scope: {
            src: '=',
            width: '='
        },
        link: function (scope, iElement, iAttrs) {
            scope.$watch('src', function() {
                iElement.css('background', 'url(' + (scope.src || 'https://placehold.it/640x640') + ') no-repeat 50% 50%');
                iElement.css('background-size', 'cover');
            });
            if(scope.width) {
                iElement.css('width', '117px');
            }
            iElement.css('height', '74px');
        }
    };
}])

.directive('gridPlus', [function () {
  return {
    restrict: 'EA',
    scope: {
      url: '@'
    },
    link: function (scope, iElement, iAttrs) {
      iElement.css('width', '100%');
      iElement.css('height', iElement[0].offsetWidth + 'px');
      iElement.css('line-height', iElement[0].offsetWidth + 'px');
      iElement.css('font-size', (iElement[0].offsetWidth * 0.33) + 'px');
      iElement.css('text-align', 'center');
      iElement.css('cursor', 'pointer');
      iElement.addClass('body-gradient');
    },
    controller: ['$scope', '$state', function($scope, $state) {
    }]
  };
}])

.directive('squareImg', [function () {
    return {
        restrict: 'EA',
        scope: {
            src: '=',
            width: '='
        },
        link: function (scope, iElement, iAttrs) {
            scope.$watch('src', function() {
                iElement.css('background', 'url(' + (scope.src || 'https://placehold.it/640x640') + ') no-repeat 50% 50%');
                iElement.css('background-size', 'cover');
            });
            if(scope.width) {
                iElement.css('width', scope.width ? (scope.width + 'px') : '100%');
            }
            iElement.css('height', iElement[0].offsetWidth + 'px');
        }
    };
}])

.directive('squareEl', [function () {
    return {
        restrict: 'EA',
        link: function (scope, iElement, iAttrs) {
          iElement.css('height', iElement[0].offsetWidth + 'px');
        }
    };
}])

.directive('wideImg', [function () {
    return {
        restrict: 'EA',
        scope: {
            src: '='
        },
        link: function (scope, iElement, iAttrs) {
            scope.$watch('src', function() {
                iElement.css('background-color', 'white');
                iElement.css('background-size', 'cover');
                iElement.css('display', 'block');
            });
            iElement.css('width', '100%');
            iElement.css('height', '100%');
        }
    };
}])

.directive('keyboardOff', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            event.preventDefault();
        });
    };
})

.directive("readonlyarea", function() {
    return {
        restrict: 'EA',
        scope: {
          readonlyarea: '='
        },
        link: function (scope, iElement, iAttrs) {
          if(scope.readonlyarea) {
            var svg = angular.element('<div class="hidearea"></div>');
            iElement.append(svg);
          } else {
            angular.element(document.querySelector(".hidearea")).remove();
          }
        }
    };
})

.directive('angularRefresh', ['$parse', '$timeout', '$http', function ($parse, $timeout, $http) {
    return {
        restrict: 'E',
        template: '<div></div>',
        replace: true,
        link: function (scope, element, attrs) {
            var isRunning = true;
            var method = 'get';
            var url = '';
            
            function successFunction(data) {
              if (data !== undefined && isRunning) {
                try {
                  $parse(attrs.ngModel).assign(scope, data);
                }
                catch (error) {
                  //Just in case scope got detroyed while we were trying to update
                  // console.log(error);
                }
              }

              if (isRunning) {
                $timeout(function () { refreshFromUrl(url, interval); }, interval);
              }
            }

            function refreshFromUrl(url, interval) {
              if (isNaN(interval)) {
                interval = 2000;
              }
              $http[method](url).success(function (data, status, headers, config) {
                successFunction(data);
              })
              .error(function (data, status, headers, config) {
                // console.log(data);
              });
            }

            if (attrs.ngModel !== undefined && attrs.ngModel !== '' && attrs.url !== undefined && attrs.url !== '') 
            {
                var interval = parseInt(attrs.interval, 10);
                if(isNaN(interval)) {
                    interval = 2000;
                }
                    
                if(attrs.method !== undefined && attrs.method !== '') {
                  if(attrs.method.toLowerCase() == 'get' || attrs.method.toLowerCase()=='jsonp') {
                    method = attrs.method.toLowerCase();
                  }
                }

                url = attrs.url;
                refreshFromUrl(url, interval);
            }

            scope.$on('$destroy', function () {
                isRunning = false;
            });
        }
    };
}])

.directive('btnLoading',function () {
        return {
            link:function (scope, element, attrs) {
                scope.$watch(
                    function () {
                        return scope.$eval(attrs.btnLoading);
                    },
                    function (value) {
                        if(value) {
                            if (!attrs.hasOwnProperty('ngDisabled')) {
                                element.addClass('disabled').attr('disabled', 'disabled');
                            }

                            element.data('resetText', element.html());
                            element.html(element.data('loading-text'));
                        } else {
                            if (!attrs.hasOwnProperty('ngDisabled')) {
                                element.removeClass('disabled').removeAttr('disabled');
                            }

                            element.html(element.data('resetText'));
                        }
                    }
                );
            }
        };
    })
;

