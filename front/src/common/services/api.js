angular.module( 'shopnow', [] )

.service('Insights', function($http) {
  // http://localhost:3000/api/insights/page?start=2015-12-08&end=2015-12-08&ts=1&id=389048244481889&event=open&g=month&rt=all
  this.report = function(options) {
    return $http.get(window.API_URL + '/insights/' + options.n + '?g=hour&rt=all&ts=1&start=' + options.start + '&end=' + options.end + '&id=' + options.i + '&event=' + options.e);
  };
})

.factory( 'API', function($q, $http, $cookies, $timeout, ngFB, lodash) {//$http, Facebook
  return {
    api_url: window.API_URL,
    
    estimateTargeting: function(adID) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: '/api/ad/estimateTargeting?adID=' + adID
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data.data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    getPages: function(userID, token) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: '/api/user/pages?userID=' + userID
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data.data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getFans: function(pageID, token) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: '/api/business/fans?filter=random&pageID=' + pageID
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data.data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    debugToken: function(token) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/token/debug?input_token=' + token + '&access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },   
    
    addPage: function(pageID) {
      var deferred = $q.defer();

      $http.post(this.api_url + '/brand', {
          pageID: pageID
        }).then(function(response) {
          deferred.resolve(response);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    authPage: function(page) {
      var self = this;
      var deferred = $q.defer();
      self.debugToken(page.access_token).then(function(response) {
        if(response && (response.is_admin === true || ($cookies.get('userID') === response.user_id && page.id === response.profile_id))) {
          self.addPage(page.id).then(function(response) {
            deferred.resolve('AUTHED');        
          });
        } else {
          deferred.reject('NOT AUTHED');
        }
      });     
      return deferred.promise; 
    },
    
    getMe: function() {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/user/me?fields=facebook_id,name,first_name,last_name,gender,picture,roles,email,is_ready,is_admin,is_business,count_subscriptions,access_token,enabled_notifications,job_title,phone,billing_address,customer_valid_vat_number&access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    deleteOffer: function(offer_id) {
      var deferred = $q.defer();

      var req = {
       method: 'DELETE',
       url: this.api_url + '/offer/' + offer_id + '?access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    getOffersFromPage: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/brand/' + options.facebook_id + '/all_offers?access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getSubscribersFromPage: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/brand/' + options.facebook_id + '/subscribers?access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getRequestsFromPage: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/brand/' + options.facebook_id + '/subscribers_requests?access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    getAdminAllPages: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/brands/all?fields=facebook_id,name,picture,insights,created_at,is_verified,facebook_category,tags&access_token=' + $cookies.get('accessToken') + (options.q ? '&q=' + options.q : '')
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getAdminAllOffers: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/offers/all?sort=expired_at&limit=20&access_token=' + $cookies.get('accessToken') + (options.q ? '&q=' + options.q : '')
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
        
    getAdminAllSubscribers: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/users/all?sort=updated_at&fields=facebook_id,first_name,last_name,name,gender,insights,updated_at,picture,subscriptions_with_offers' + (options.q ? '&q=' + options.q : '') + '&access_token=' + $cookies.get('accessToken')
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;      
    },
    
    countAdminAllSubscribers: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/users/count?access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    countAdminAllPages: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/brands/count?access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    countAdminAllOffers: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/offers/count?access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    countAdminAllRequests: function(options) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: this.api_url + '/users/count_all_requests?access_token=' + $cookies.get('accessToken'),
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
            
    saveMe: function(data) {
      var deferred = $q.defer();

      var req = {
       method: 'PUT',
       url: this.api_url + '/user/' + data.facebook_id + '?access_token=' + $cookies.get('accessToken'),
       data: data
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    validateVAT: function(data) {
      var deferred = $q.defer();

      var req = {
       method: 'PUT',
       url: this.api_url + '/user/' + data.facebook_id + '/validate_vat?access_token=' + $cookies.get('accessToken'),
       data: data
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    sendOffer: function(data) {
      var deferred = $q.defer();

      var req = {
       method: 'POST',
       url: this.api_url + '/offer/?access_token=' + $cookies.get('accessToken'),
       data: data
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    tagOffer: function(data) {
      var deferred = $q.defer();

      var req = {
       method: 'PUT',
       url: this.api_url + '/offer/' + data._id + '/tag_offer?access_token=' + $cookies.get('accessToken'),
       data: data
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    updateStore: function(data) {
      var deferred = $q.defer();

      var req = {
       method: 'PUT',
       url: this.api_url + '/brand/' + data.page.facebook_id + '?access_token=' + $cookies.get('accessToken'),
       data: data
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
                
    getPage: function(pageID) {
      var deferred = $q.defer();
      var req = {
       method: 'GET',
       url: this.api_url + '/brand/' + pageID + '?fields=facebook_id,username,name,link,picture,counters,insights,plan,active_moments,is_enabled,is_verified,is_activated,is_synched,plan'
      };
      
      $http(req).
        success(function(data, status, headers, config) {
          if(!data.error) {
            deferred.resolve(data);
          } else {
            deferred.reject({});
          }
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getOffer: function(offer_id) {
      var deferred = $q.defer();
      // alert('pageID:' + pageID);
      var req = {
       method: 'GET',
       url: this.api_url + '/offer/' + offer_id
      };
      
      $http(req).
        success(function(data, status, headers, config) {
          if(data) {
            deferred.resolve(data);
          } else {
            deferred.reject({});
          }
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    getPageCounters: function(pageID) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: '/api/business/live?pageID=' + pageID
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data.data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getAd: function(adID) {
      var deferred = $q.defer();

      var req = {
       method: 'GET',
       url: '/api/ad/' + adID
      };

      $http(req).
        success(function(data, status, headers, config) {
          deferred.resolve(data.data);
        }).
        error(function(data, status, headers, config) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    payForAd: function(ad, token) {
      var deferred = $q.defer();

      $http.put('/api/ad/pay', {
          ad: ad,
          token: token
        }).then(function(response) {
          deferred.resolve(response.data.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    // tagOffer: function(ad, token) {
    //   var deferred = $q.defer();

    //   $http.put('/api/ad/tag', {
    //       ad: ad,
    //       token: token
    //     }).then(function(response) {
    //       deferred.resolve(response.data.data);
    //     }, function(response) {
    //       deferred.reject({});
    //     });

    //   return deferred.promise;
    // },    

    cancelAd: function(adID) {
      var deferred = $q.defer();

      $http.put('/api/ad/cancel', {
          adID: adID
        }).then(function(response) {
          deferred.resolve(response.data.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    recalculateAdPrice: function(adID) {
      var deferred = $q.defer();

      $http.put('/api/ad/recalculate', {
          adID: adID
        }).then(function(response) {
          deferred.resolve(response.data.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    updateAd: function(ad, section) {
      var deferred = $q.defer();

      $http.put('/api/ad', {
          ad: ad,
          section: section
        }).then(function(response) {
          deferred.resolve(response.data.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    createAd: function(options) {
      // group, template, pageID, userID
      var deferred = $q.defer();

      $http.post('/api/ad', {
          group: options.group,
          template: options.template,
          pageID: options.pageID,
          userID: options.userID,
          maxType: options.maxType || 'unlimited'
        }).then(function(response) {
          deferred.resolve(response.data.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    cancelPlan: function(page) {
      // group, template, pageID, userID
      var deferred = $q.defer();

      $http.put(this.api_url + '/brand/' + page.facebook_id + '/cancel_plan', {stripe_cust_id: page.stripe_cust_id, stripe_subs_id: page.stripe_subs_id}).then(function(response) {
        if(response.data) {
          deferred.resolve(response.data.data);
        } else {
          deferred.reject({});
        }
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    pay: function(options) {
      // group, template, pageID, userID
      var deferred = $q.defer();

      $http.post(this.api_url + '/users/payment', options).then(function(response) {
        if(response.data) {
          deferred.resolve(response.data.data);
        } else {
          deferred.reject({});
        }
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },
    
    downloadFile: function(ext, url) {
      var deferred = $q.defer();

      $http.post('/api/downloadFile', {
          ext: ext,
          url: url
        }).then(function(response) {
          deferred.resolve(response.data.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    addAdminToPage: function(page, userID) {
      var deferred = $q.defer();

      $http.post('/api/business/team', {
          page: {facebook: page},
          adminID: userID
        }).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    updatePageSettings: function(page) {
      var deferred = $q.defer();

      $http.put(this.api_url + '/brand/' + page.facebook_id, {
          page: page
        }).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    refreshUser: function(userID, token, cb) {
      var req = {
       method: 'GET',
       url: '/api/user?userID=' + userID + '&token=' + token
      };

      $http(req).
        success(function(data, status, headers, config) {
          $cookies.putObject('user', data.data);
          if(cb) {
            return cb();
          }
        }).
        error(function(data, status, headers, config) {
          if(cb) {
            return cb();
          }
        });
    },

    deactivatePage: function(page) {
      var deferred = $q.defer();

      $http.post('/api/business/deactivate', {
          page: page
        }).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getPageTeam: function(page) {
      var deferred = $q.defer();

      $http.get('/api/business/team?pageID=' + page.facebook.id).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getPagePosts: function(page) {
      var deferred = $q.defer();

      $http.get('/api/business/posts?pageID=' + page.facebook.id).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getJob: function(jobID) {
      var deferred = $q.defer();

      $http.get('/api/job/' + jobID).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    refreshPagePosts: function(page) {
      var deferred = $q.defer();

      $http.get('/api/business/importPosts?pageID=' + page.facebook.id).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },


    getPageInvoices: function(page) {
      var deferred = $q.defer();

      $http.get('/api/payments?pageID=' + page.facebook.id).then(function(response) {
        deferred.resolve(response.data);
      }, function(response) {
        deferred.reject({});
      });

      return deferred.promise;
    },

    deleteAd: function(adID) {
      var deferred = $q.defer();

      $http.delete('/api/ad?adID=' + adID).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getPageAds: function(pageID, group) {
      if(!group) {
        group = 'default';
      }

      var deferred = $q.defer();

      $http.get('/api/ads?' + 'pageID=' + pageID + '&group=' + group).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getTimezones: function() {
      var deferred = $q.defer();

      $http.get('/api/tools/timezones').then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    getCountries: function() {
      var deferred = $q.defer();

      $http.get('/api/tools/countries').then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },


    sendCampaignTest: function(adID, userID) {
      var deferred = $q.defer();

      $http.post('/api/ad/test', {
          adID: adID,
          userID: userID
        }).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    },

    deactivateTeamPlayer: function(page, player) {
      var deferred = $q.defer();

      $http.delete('/api/business/team', {
          player: player,
          page: page
        }).then(function(response) {
          deferred.resolve(response.data);
        }, function(response) {
          deferred.reject({});
        });

      return deferred.promise;
    }

  };
})

;


