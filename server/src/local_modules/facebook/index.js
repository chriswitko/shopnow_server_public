"use strict";

var config = require('../../config/config.js');
var graph = require('fbgraph');
var moment = require('moment-timezone');
var _ = require('lodash');

var app_token = config.facebook.clientID + '|' + config.facebook.clientSecret;

graph.setVersion('2.5');

exports.debug = function(options, callback) {
  callback = callback || function() {};
  
  var url = '/debug_token?input_token=' + options.input_token + '&access_token=' + app_token;
  console.log('url', url);
  
  graph.get(url, function(err, output) {
    if(err) {
      return callback(err, {});
    }
    callback(err, output.data);
  });
    
}

exports.accounts = function(options, callback) {
  callback = callback || function() {};

  if(!options.access_token) {
    return callback('Missing token');
  }

  options.likes = options.likes || [];
  
  var limit = 100;

  graph.setAccessToken(options.access_token || app_token);

  var url = '/' + options.user_id + '/accounts?limit=' + limit + '&fields=id,category,name,picture,bio,category_list,contact_address,cover,current_location,location,description,emails,general_info,link,phone,username,website,likes' + (options.after ? '&after=' + options.after : '');

  graph.get(url, function(err, output) {
    if(err) {
      return callback(err, {likes: {}});
    }
    _.each(output.data, function(page) {
      page = exports.format_page(page);
      options.likes.push(page);
    });
    callback(err, {likes: options.likes, after: output.paging ? output.paging.cursors.after : ''});
  });
}


exports.posts = function(options, callback) {
  callback = callback || function() {};
  graph.setAccessToken(options.access_token || app_token);
  
  var cutoff = moment().add(-7, 'days').unix();
  
  options.since = options.since || cutoff;

  var url = '/' + options.pageID + '/posts?type=link,status,photo&limit=5&fields=id,from.fields(id, name, website),message,picture,full_picture,link,type,created_time' + (options.after ? '&after=' + options.after : '') + (options.since ? '&since=' + options.since : '');

  graph.get(url, function(err, output) {
    if(err) {
      return callback(err, {});
    }
    callback(err, output.data);
  });
}

exports.format_page = function(page) {
  if('id' in page) {
    page.facebook_id = page.id;
    delete page.id;
  }
  
  if('category' in page) {
    page.facebook_category = page.category;
    delete page.category;
  }
  
  if('category_list' in page) {
    page.facebook_category = page.category_list[0].name;
    delete page.category_list;
  }
  
  if('cover' in page) {
    page.cover = page.cover.source;
  }
  
  if('picture' in page) {
    page.picture = page.picture.data.url;
  }
  
  if('emails' in page) {
    page.email = page.emails[0];
    delete page.emails;
  }
  
  if('location' in page) {
    page.city = page.location.city;
    page.country = page.location.country;
    page.street = page.location.street;
    page.zip = page.location.zip;
    if('latitude' in page.location) {
      page.geo = [page.location.longitude, page.location.latitude];
    }
    delete page.location;
  }
  
  if('website' in page) {
    var links = [];
    var pattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi
    
    if(page.website) {
      links = page.website.match(pattern) || [];
    } else {
      links = [];
    }
    if(!links.length) {
      page.website = '';
    } else {
      page.website = links[0];
    }
    if(page.website.length) {
      if(page.website.trim().indexOf('http') === 0) {
        page.website = page.website;
      } else {
        page.website = 'http://' + page.website.trim();
      }
      page.link = page.website;
      delete page.website;
    }
  }
  return page;      
}

exports.page = function(options, callback) {
  callback = callback || function() {};

  graph.setAccessToken(options.access_token || app_token);

  var url = '/' + options.page_id + '?fields=id,category,name,picture,bio,category_list,contact_address,cover,current_location,location,description,emails,general_info,link,phone,username,website,likes';

  graph.get(url, function(err, output) {
    if(err) {
      return callback(err, {page: {}});
    }
    callback(err, {page: exports.format_page(output)});
  });
}

exports.likes = function(options, callback) {
  var self = this;
  callback = callback || function() {};

  if(!options.access_token) {
    return callback('Missing token');
  }

  options.likes = options.likes || [];
  
  var iteraction = options.iteraction || 1;
  var max = options.max || 1;
  
  var limit = options.limit ? options.limit: (options.loop ? 100 : 20);

  graph.setAccessToken(options.access_token || app_token);

  var url = '/' + options.user_id + '/likes?limit=' + limit + '&fields=id,category,name,picture,bio,category_list,contact_address,cover,current_location,location,description,emails,general_info,link,phone,username,website,likes' + (options.after ? '&after=' + options.after : '');

  graph.get(url, function(err, output) {
    if(err) {
      return callback(err, {likes: {}});
    }
    _.each(output.data, function(page) {
      page = exports.format_page(page);
      options.likes.push(page);
    });
    if(options.loop) {
      if(iteraction === max || (output.paging && !output.paging.cursors.after)) {
        callback(err, {likes: options.likes, after: output.paging ? output.paging.cursors.after : ''});
      } else if (output.paging && output.paging.cursors.after) {
        iteraction = iteraction + 1;
        self.likes({user_id: options.user_id, access_token: options.access_token, likes: options.likes, loop: options.loop, iteraction: iteraction, max: max, after: output.paging ? output.paging.cursors.after : ''}, callback);
      } else {
        callback(err, {likes: options.likes, after: output.paging ? output.paging.cursors.after : ''});
      }
    } else {
      callback(err, {likes: options.likes, after: output.paging ? output.paging.cursors.after : ''});
    }
  });
}

exports.friends = function(options, callback) {
  callback = callback || function() {};

  if(!options.access_token) {
    return callback('Missing token');
  }

  graph.setAccessToken(options.access_token || app_token);

  var url = '/' + options.userID + '/friends?limit=100&fields=id,name,picture,link' + (options.after ? '&after=' + options.after : '');

  graph.get(url, function(err, output) {
    if(err) {
      return callback(err, {});
    }
    callback(err, output.data);
  });
};

exports.me = function(options, callback) {
  callback = callback || function() {};

  if(!options.access_token) {
    return callback('Missing token');
  }

  graph.setAccessToken(options.access_token || app_token);

  var url = '/me?fields=email,first_name,gender,id,last_name,link,locale,name,picture,location,birthday';

  graph.get(url, function(err, user) {
    if(err) {
      return callback(err, {});
    }
    if('id' in user) {
      user.facebook_id = user.id;
      delete user.id;
    }
    if('picture' in user) {
      user.picture = user.picture.data.url;
    }
    if('location' in user) {
      user.location = user.location.name;
    }
    callback(err, user);
  });
}

exports.api = function(options, callback) {
  callback = callback || function() {};

  graph.setAccessToken(options.access_token || app_token);

  var fields = options.fields ? '?fields=' + options.fields : '';
  if(options.obj_name === 'post') {
    fields = '?fields=id,from.fields(id, name, website),message';    
  }

  if(options.obj_name === 'page') {
    fields = '?fields=id,website';    
  }

  var url = '/' + options.obj_id + fields;

  graph.get(url, function(err, output) {
    if(err) {
      return callback(err, {page: {}});
    }
    callback(err, output);
  });
}

exports.get_access_token = function(options, callback) {
  var url = '/oauth/access_token?redirect_uri=' + config.host + '&grant_type=fb_exchange_token&client_id=' + config.facebook.clientID + '&client_secret=' + config.facebook.clientSecret + '&fb_exchange_token=' + options.access_token;

  callback = callback || function() {};

  graph.get(url, function(err, token) {
    callback(err, token);
  });
}