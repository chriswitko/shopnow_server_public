angular.module( 'security', [] )

.factory( 'Authed', function($q, $http, $cookies, $window, ngFB, lodash, API) {//$http, Facebook
  return {
    api_url: window.API_URL,
    
    getCurrentUser: function() {
      return $cookies.get('userID') || null;
    },

    isAuthed: function() {
      var deferred = $q.defer();
      ngFB.getLoginStatus().then(function(response) {
        if(response.status === 'connected') {
          deferred.resolve($cookies.get('accessToken') ? true : false);
        } else {
          deferred.reject(false);
        }
      });
      return deferred.promise;
    },

    isAdmin: function() {
      // console.log('isadmin?', $cookies.get('isAdmin'));
      return $cookies.get('isAdmin') && $cookies.get('isAdmin') === 'true' ? true : false;      
    },
    
    logout: function(cb) {
      $cookies.put('user', null, {expires: 'Wed, 31 Oct 2012 08:50:17 GMT'});
      $cookies.put('userID', null, {expires: 'Wed, 31 Oct 2012 08:50:17 GMT'});
      $cookies.put('fbToken', null, {expires: 'Wed, 31 Oct 2012 08:50:17 GMT'});
      $cookies.put('accessToken', null, {expires: 'Wed, 31 Oct 2012 08:50:17 GMT'});
      $cookies.put('isAdmin', null, {expires: 'Wed, 31 Oct 2012 08:50:17 GMT'});
      delete $cookies["user"];
      delete $cookies["userID"];
      delete $cookies["fbToken"];
      delete $cookies["accessToken"];
      delete $cookies["isAdmin"];
      return cb();
    },

    hasPermission2: function(pageID) {
      if(this.isAuthed()) {
        var currentUser = this.getCurrentUser();
        if(currentUser.pages.indexOf(pageID) > -1) {
          return true;
        }
      }
      return false;
    },

    hasPermission: function(pageID) {
      var deferred = $q.defer();

      var currentUser = this.getCurrentUser();

      if(this.isAuthed()) {
        $http.post('/api/business/verifyPermission', {
            pageID: pageID,
            userID: currentUser.id
          }).then(function(response) {
            deferred.resolve(response.data);
          }, function(response) {
            deferred.reject({});
          });
      } else {
        deferred.reject({});
      }

      return deferred.promise;
    },

    authorize: function(returnUrl, permissions) {
      var self = this;
      
      if(!permissions) {
        permissions = 'email,user_likes,user_friends,user_birthday,manage_pages';
      }
      if(!returnUrl) {
        returnUrl = '/business';
      }
      
      ngFB.login({scope: permissions})
        .then(function (response) {
          if (response.status === 'connected') {
            $cookies.put('userID', response.authResponse.userID, {path: '/'});
            $cookies.put('fbToken', response.authResponse.accessToken, {path: '/'});

            var req = {
            method: 'GET',
            url: self.api_url + '/oauth?access_token=' + response.authResponse.accessToken + '&is_business=true'
            };

            $http(req).
              success(function(data, status, headers, config) {
                if(data && data.access_token) {
                  $cookies.put('accessToken', data.access_token, {path: '/'});
                  API.getMe().then(function(me) {
                    $cookies.put('userID', me.facebook_id, {path: '/'});
                    $cookies.put('isAdmin', me.roles.data.indexOf('admin') > -1 || me.is_admin, {path: '/'});
                    $cookies.put('fbToken', me.access_token, {path: '/'});
                    $window.location.href = returnUrl + '?token=' + me.access_token;
                  });
                } else {
                  alert('Facebook login error. Please try again.');
                }
              }).
              error(function(data, status, headers, config) {
                // console.log('error', data);
              });
          } else {
            alert('Facebook login error. Please try again.');
          }
      });
    },

    isConnected: function(returnUrl) {
      if(!returnUrl) {
        returnUrl = '/business';
      }

      var deferred = $q.defer();

      ngFB.getLoginStatus().then(function(response) {
        if(response.status === 'connected') {
          ngFB.api('/me/permissions', function(response) {
            var permissions = lodash.map(response.data, function(item) {
              if(item.status === 'granted') {
                return item.permission;
              }
            });
            if(permissions.indexOf('manage_pages') > -1) {
              deferred.resolve(true);
            } else {
              // window.location = returnUrl;
              deferred.reject('Not logged in');
            }
          });
        } else {
          // window.location = returnUrl;
          deferred.reject('Not logged in');
        }
      });

      return deferred.promise;
    }
  };
})

.factory('AuthInterceptor',
function($injector, $location, $q) {
  return {
    responseError: function(rejection) {
      if (rejection.status === 401 && rejection.config.url !== '/business') {
        var $state = $injector.get('$state');
        // This is the interesting bit:
        $state.go('business', {url: $location.url()});
      }
      return $q.reject(rejection);
    }
  };
})

;


