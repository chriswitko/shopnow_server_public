"use strict";

var config = require('../config/config.js');
var async = require('async');
var _ = require('lodash');
var jwt    = require('jsonwebtoken');
var stripe = require("stripe")(config.stripe_token);

var Model = require('../services').Page;

var Helper = require('../local_modules/helper');
var paging = require('../local_modules/paging');

// var redis = require('redis');
// var redis_client = redis.createClient({host: '192.168.99.100', port: 32768}, null, { detect_buffers: true });

exports.get_all = function(req, res, next) {
  var header = parse_query(req);

  async.waterfall([
    function(done) {
      // console.log('header.options.schema', header.options.schema);
      Model.get_dataset(req.params.dataset || 'get_all', header.query, {schema: header.options.schema, summary: header.options.summary, limit: header.options.limit, after: header.options.after}, done);
    },
    function(result, paging, summary, done) {
      // Model.format_object(result, header, paging, summary, done);
      format_page_output(result, {schema: header.options.schema, subscribed_pages: req.user.subscribed_pages, requested_pages: req.user.requested_pages, user: header.options.user, fields: header.options.fields}, function(err, result) {
        done(null, result, header, paging, summary, done);
      });
    }
  ], function(err, result, paging, summary) {
    res.json(Helper.format_response(err, {data: result, paging: paging, summary: summary}));    
  })
}

var format_page_output = function(result, options, callback) {
  var temp = [];
  console.log('options.fields', options.fields);
  async.forEach(result, function(page, next) {
    page.query({facebook_id: page.facebook_id}, {schema: options.schema, fields: options.fields || ['facebook_id','username','name','description','link','picture','cover','counters','is_subscribed','insights','geo', 'offers', 'facebook_category', 'is_verified'], user: options.user}, function(err, output) {
      options.subscribed_pages = options.subscribed_pages || [];
      options.requested_pages = options.requested_pages || [];
      _.extend(output, {is_subscribed: options.subscribed_pages.indexOf(page.facebook_id) > -1})        
      _.extend(output, {is_requested: options.requested_pages.indexOf(page.facebook_id) > -1})        
      temp.push(output);
      next();
    });
  }, function() {
    callback(null, temp);
  }) 
}

exports.update = function(req, res, next) {
  if(req.body.page.tags) {
    req.body.page.tags = req.body.page.tags.split(',');
    var temp_tags = [];
    _.map(req.body.page.tags, function(tag){
      temp_tags.push(tag.replace(/ /g, ''));
    });
    req.body.page.tags = temp_tags;
  }
  Model.get_me({facebook_id: get_page_id(req)}, {facebook_id: get_page_id(req), schema: req.signed.schema_type}, function(err, page) {
    Model(page).update_object(req.body.page, function(err, result) {
      res.json(Helper.format_response(err, {status: 'success', data: result}));
    })
  });
}

exports.me = function(req, res, next) {
  var header = parse_query(req);
  _.extend(header.options, {page_id: get_page_id(req)});
  
  if(req.query.refresh) {
    _.extend(header.options, {timeout: -1, raw: true});
  }
  
  async.waterfall([
    function(done) {
      Model.get_me(header.query, {facebook_id: header.query.facebook_id, schema: header.options.schema, timeout: header.options.timeout}, done)
    },
    function(page, paging, summary, done) {
      page.query(header.query, {schema: header.options.schema, fields: header.options.fields, user: header.options.user, subscribed_pages: req.user.subscribed_pages, requested_pages: req.user.requested_pages, timeout: header.options.timeout, sort: header.options.sort, after: header.options.after, limit: header.options.limit}, done)
      // format_page_output([page], {subscribed_pages: req.user.subscribed_pages, requested_pages: req.user.requested_pages, user: header.options.user}, function(err, result) {
      //   done(null, result, header, paging, summary, done);
      // });
    }
  ], function(err, result) {
    // result = result ? result[0] : {};
    // res.json(Helper.format_response(err, Helper.clean_json(result)));
    res.json(Helper.format_response(err, Helper.clean_json(result)));
  })
}


exports.cancel_plan = function(req, res, next) {
  async.waterfall([
    function(done) {
      Model.get_me({}, {facebook_id: req.params.page_id, schema: 'default'}, done)
    },
    function(page, paging, summary, done) {
      stripe.customers.cancelSubscription(
        page.stripe_cust_id,
        page.stripe_subs_id,
        function(err, confirmation) {
          if (err && err.type === 'StripeCardError') {
            return res.json({status: 'error'});
          }
          page.update({stripe_cust_id: '', stripe_subs_id: '', plan: 'free'}, function() {
            done(err, confirmation);
          })
        }
      );  
    }
  ], function(err, result) {
    res.json({status: 'success', data: result});
  })
}

exports.count_all = function(req, res, next) {
  Model.count_all(function(err, result) {
    res.json({total: result});
  })
}

exports.add = function(req, res, next) {
  var temp = new Model();
  
  temp.add({id: req.body.pageID, access_token: req.user.access_token}, function(err, result) {
    res.json({data: result});
  });
}

exports.public = function(req, res, next) {
  var header = parse_query(req);
  _.extend(header.options, {page_id: get_page_id(req)});
  
  async.waterfall([
    function(done) {
      Model.get_public({}, {facebook_id: header.query.facebook_id, schema: 'basic'}, done)
    },
    function(page, paging, summary, done) {
      if(!page) {
        return res.json(Helper.format_response('No Page', Helper.clean_json({})));;
      }
      format_page_output([page], {}, function(err, result) {
        done(null, result, header, paging, summary, done);
      });
    }
  ], function(err, result) {
    result = result ? result[0] : {};
    res.json(Helper.format_response(err, Helper.clean_json(result)));
  })
}

/*
  SUPPORT METHODS
*/

var get_user_id = function(req) {
  return req.query.user_id || req.signed.id;
}

var get_page_id = function(req) {
  return req.params.page_id;
}

var parse_query = function(req) {
  var fields = (req.params.field || req.query.fields || '').trim();
  var options = {
    fields: fields.length ? fields.split(',') : '', 
    schema: req.signed ? req.signed.schema_type : 'basic',
    summary: req.query.summary,
    limit: req.query.limit,
    after: req.query.after,
    user_id: req.query.user_id,
    page_id: req.params.page_id, 
    user: req.user
  }
  var query = {
    q: req.query.q,
    facebook_id: req.params.page_id,
    page_ids: req.query.page_ids 
  }
  return {
    options: options,
    query: query
  }  
}
