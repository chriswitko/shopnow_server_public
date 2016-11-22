var _ = require('lodash');
var config = require('../../config/config.js');

var paging = function(options) {
  // TODO: add buildQueryString from object and apply to endpoint as query string
  var total = options.total, 
      page = parseInt(options.after, 10) || 1, 
      limit = options.limit, 
      endpoint = options.endpoint,
      paging = {},
      cursors = {},
      total_pages = Math.ceil(total / limit);
 
  if(page < total_pages) {
    cursors.after = page + 1;
    if(endpoint && endpoint.url) {
      paging.next = config.host + config.api_endpoint + endpoint.url + '/?' + 'after=' + cursors.after + (endpoint.params && endpoint.url.indexOf('?') ? '&' : '')  + (endpoint.params ? toQueryString(endpoint.params) : '');
    }
  }
  
  if(page > 1) {
    cursors.before = page - 1;
    if(endpoint && endpoint.url) {
      paging.previous = config.host + config.api_endpoint + endpoint.url + '/?' + 'after=' + cursors.before + (endpoint.params && endpoint.url.indexOf('?') ? '&' : '') + (endpoint.params ? toQueryString(endpoint.params) : '');
    }
  }
  
  if(Object.keys(cursors).length) {
    paging.cursors = cursors;
  }
  
  return Object.keys(paging).length ? paging : null;
}

var toQueryString = function(obj) {
  if(obj) {
    delete obj.after;
    return _.map(obj,function(v,k){
      return encodeURIComponent(k) + '=' + encodeURIComponent(v);
    }).join('&');
  }
  return obj;
};

var build_endpoint = function(endpoint, params) {
  return endpoint + '?' + toQueryString(params);
}

module.exports = {
  build: paging,
  toQueryString: toQueryString,
  build_endpoint: build_endpoint
};
