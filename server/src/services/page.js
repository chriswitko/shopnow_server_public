var _ = require('lodash');
var async = require('async');
var moment = require('moment-timezone')
var kue = require('kue');
var queue = kue.createQueue();

var myError = require('../local_modules/myerror');
var Facebook = require('../local_modules/facebook');

var Page = require('../models').Page;
var User = require('../models').User;
var Offer = require('../models').Offer;
var UserLike = require('../models').UserLike;
var Insight = require('../models').Insight;
var UserLike = require('../models').UserLike;

var baseService = require('./base');
_.extend(Page.prototype, baseService);

Page.prototype.count_subscribers = function(callback) {
  var self = this;
  callback = callback || function() {};
  User.count_subscribers(self.facebook_id, callback);
}

Page.prototype.count_subscribers_requests = function(callback) {
  var self = this;
  callback = callback || function() {};
  User.count_requests_by_page(self.facebook_id, callback);
}

Page.schema.custom('is_subscribed', {acl: 'owner'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};
  if(!options.user) {
    return callback(null);
  }
  options.subscribed_pages = options.subscribed_pages || [];
  callback.apply(this, [null, options.subscribed_pages.indexOf(self.facebook_id) > -1]);
})

Page.schema.custom('is_requested', {acl: 'owner'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};
  if(!options.user) {
    return callback(null);
  }
  options.requested_pages = options.requested_pages || [];
  callback.apply(this, [null, options.requested_pages.indexOf(self.facebook_id) > -1]);
})

Page.schema.custom('subscribers', {acl: 'owner'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};
  if(!options.user) {
    return callback(null);
  }
  User.get_subscribers({}, {page_id: self.facebook_id, schema: 'default'}, function(err, result, paging, summary) {
    result = _.map(result, function(subscriber) {
      return subscriber.toSchema();
    })
    callback.apply(this, [null, result]);
  });
})

Page.schema.custom('offers', {acl: 'default'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};
  if(!options.user) {
    return callback(null);
  }

  var now = new Date().valueOf();
  var then = options.user.created_at;
  var day = moment().utc().format('D');
  var month = moment().utc().format('M');
  var user_created_days_ago = moment.duration(moment(now).diff(then)).days();

  var get_standard_offers = Offer.get_offers_for_brand.bind(Offer, {page_id: self.facebook_id, 'targeting.age_from': options.user.age, 'targeting.age_to': options.user.age, 'targeting.gender': options.user.gender}, {schema: 'default'});
  var get_requested_offers = Offer.get_requested_offers.bind(Offer, {page_id: self.facebook_id}, {schema: 'default'});
  var get_welcome_moments = Offer.get_welcome_moments.bind(Offer, {page_id: self.facebook_id }, {schema: 'default'});
  var get_birthday_moments = Offer.get_birthday_moments.bind(Offer, {page_id: self.facebook_id }, {schema: 'default'});
  
  var tasks = [];
      tasks.push(get_standard_offers);
      tasks.push(get_requested_offers);
      if(user_created_days_ago <= 3) {
        tasks.push(get_welcome_moments);
      }
      if(options.user.birth_date === day && options.user.birth_month === month) {
        tasks.push(get_welcome_moments);
      }

  async.series(tasks, function(err, result) {
    var all = [];
    if(result) {
      result.forEach(function(el, idx) {
        if(result.length && result[idx] && result[idx].length && result[idx][0]) {
        result[idx][0].forEach(function(row) {
          if(row.category === 'welcome_moment') { 
            row.expired_at = moment(options.user.created_at).add(3, 'days');
          } else if(row.category === 'birthday_moment') {
            row.expired_at = moment(now).add(1, 'day');
          }
          all.push(row);
        })
        }
      })

      result = _.map(all, function(offer) {
        return offer.toSchema();
      })      
    }

    callback.apply(this, [null, (result || [])]);
  });
})

var format_offer_output = function(result, options, callback) {
  var temp = [];
  async.forEach(result, function(offer, next) {
    offer.query({_id: offer._id}, {schema: 'owner', user: options.user, fields: ['_id', 'page_id', 'category', 'title', 'message', 'redemption_code', 'link', 'picture', 'targeting', 'timezone', 'is_auto', 'valid_days', 'expired_at', 'created_at', 'counters', 'insights']}, function(err, output) {
      temp.push(output);
      next();
    });
  }, function() {
    callback(null, temp);
  }) 
}


Page.schema.custom('all_offers', {acl: 'owner'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};
  if(!options.user) {
    return callback(null);
  }
  Offer.get_all_offers({page_id: self.facebook_id, 'targeting.age_from': options.user.age, 'targeting.age_to': options.user.age, 'targeting.gender': options.user.gender}, {schema: 'default'}, function(err, result, paging, summary) {
    format_offer_output(result, {subscribed_pages: self.subscribed_pages, requested_pages: self.requested_pages, user: options.user}, function(err, output) {
      callback(err, {data: output, paging: paging, summary: summary});
    })
    // result = _.map(result, function(offer) {
    //   return offer.toSchema('default', ['_id', 'page_id', 'category', 'title', 'message', 'redemption_code', 'link', 'picture', 'targeting', 'timezone', 'is_auto', 'valid_days', 'expired_at', 'created_at', 'counters', 'insights']);
    // })
    // callback.apply(this, [null, result]);
  });
})

Page.schema.custom('subscribers_requests', {acl: 'owner'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};
  if(!options.user) {
    return callback(null);
  }
  User.get_requests_by_page({}, {page_id: self.facebook_id, schema: 'default'}, function(err, result, paging, summary) {
    result = _.map(result, function(subscriber) {
      return subscriber.toSchema();
    })
    callback.apply(this, [null, result]);
  });
})

Page.schema.custom('insights', {acl: 'owner', alias: 'counters_live'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};
  if(!options.user) {
    return callback(null);
  }
  async.parallel({
    subscribers: self.count_subscribers.bind(self),
    requests: self.count_subscribers_requests.bind(self),
    all_offers: Offer.count_all_offers_per_brand.bind(Offer, self.facebook_id),
    active_offers: Offer.count_active_offers_per_brand.bind(Offer, self.facebook_id),
    targeted_offers: Offer.count_targeted_offers.bind(Offer, self.facebook_id, {'targeting.age_from': options.user.age, 'targeting.age_to': options.user.age, 'targeting.gender': options.user.gender}, {counter_only: true}),
    delivers: Insight.generate.bind(self, {start_date: '2016-01-01', end_date: '2016-12-31', obj_name: 'page', obj_id: self.facebook_id, event_name: 'delivery', g: 'hour', rt: 'all', merge: 1, internal: 1}),
    clicks: Insight.generate.bind(self, {start_date: '2016-01-01', end_date: '2016-12-31', obj_name: 'page', obj_id: self.facebook_id, event_name: 'click', g: 'hour', rt: 'all', merge: 1, internal: 1}),
    views: Insight.generate.bind(self, {start_date: '2016-01-01', end_date: '2016-12-31', obj_name: 'page', obj_id: self.facebook_id, event_name: 'view', g: 'hour', rt: 'all', merge: 1, internal: 1})
  }, function(err, counters) {
    if(err) {
      return callback(err);
    }
    self.update_object({counters: counters}, callback.apply(this, [null, counters]))
  });
})

Page.prototype.get_admins = function(query, options, callback) {
  callback = callback || function() {};
  callback(null, [
    {'user_id': '321'}
  ]);
}

Page.prototype.bulk_subscribers = function(page_id, user_ids, callback) {
  User.update({facebook_id: {$in: user_ids}}, {$addToSet: {subscribed_pages: page_id}}, callback);
}

Page.prototype.add = function(options, callback) {
  var self = this;
  callback = callback || function() {};

  Facebook.api({obj_id: options.id, access_token: options.access_token, fields: 'id,category,name,picture,bio,category_list,contact_address,cover,current_location,location,description,emails,general_info,link,phone,username,website,likes'}, function(err, result) {
    if(result.name) {
      Page.create_object({id: result.id||result.facebook_id, data: Facebook.format_page(result), skip: true}, function(err, result) {
        UserLike.get_subscribers(options.id, function(err, users) {
          var user_ids = _.map(users, function(user) {
            return user.user_id;
          }, []);
          var job = queue.create('refresh_offers', {
            page: result
          }).save( function(err){
            if( !err ) console.log( job.id );
            self.bulk_subscribers(options.id, user_ids, function(err, finito) {
              callback(err, result);
            });
          });
        });
      });
    } else {
      callback(err, result);
    }
  })
}

Page.prototype.is_requested = Page.schema.statics.is_requested;
Page.prototype.is_subscribed = Page.schema.statics.is_subscribed;
Page.prototype.subscribers = Page.schema.statics.subscribers;
Page.prototype.subscribers_requests = Page.schema.statics.subscribers_requests;
Page.prototype.all_offers = Page.schema.statics.all_offers;
Page.prototype.offers = Page.schema.statics.offers;
Page.prototype.insights = Page.schema.statics.insights;
Page.prototype.basic = Page.get_me.bind(Page);

module.exports = Page;