var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment-timezone')

var Helper = require('../local_modules/helper');
var myError = require('../local_modules/myerror');

var baseSchema = require('./base');
var modelName = Helper.build_module_name(__filename);

var modelSchema = baseSchema.extend({
  page_id: {type: String, required: true, trim: true, fulltext: true, index: true, acl: 'default'},
  post_id: {type: String, trim: true, fulltext: true, index: true, acl: 'default'},
  is_offer: {type: Boolean, default: false, acl: 'default'},
  is_enabled: {type: Boolean, default: true, acl: 'default'}, // support when brand would like to disable auto-suggested offer
  created_at: {type: Date, default: Date.now, acl: 'default'},
  updated_at: {type: Date, default: Date.now}
});

modelSchema.tree._id.acl = 'default';

modelSchema.pre('save', function(next) {
  var self = this;
  
  self.expired_at = moment(self.deliver_at).add(self.valid_days, 'days');
  
  next();
});

modelSchema.statics.find_by_id = function (element_id, callback) {
  callback = callback || function() {};
  if(!element_id) {
    return callback();
  }
  
  var query = {};
  if(Helper.isObjectID(element_id)) {
    query = {_id: element_id};
  } else {
    query = {post_id: element_id};
  }
  this.findOne(query).exec(function(err, element) {
    if(err) {
      return callback(err);
    }
    if(!element) {
      return callback(); // 'User does not exists' but it's not error
    }
    callback(null, element);
  });
};

modelSchema.statics.count_all = function(callback) {
  callback = callback || function() {};
  var now = new Date();
  this.count({is_enabled: true, deliver_at: {$lte: now.valueOf()}, expired_at: {$gte: now.valueOf()}}).cache().exec(callback);
}

modelSchema.statics.count_active_offers_per_brand = function(page_id, callback) {
  callback = callback || function() {};
  var now = new Date();
  this.count({is_auto: false, is_enabled: true, category: 'standard_offer', page_id: page_id, deliver_at: {$lte: now.valueOf()}, expired_at: {$gte: now.valueOf()}}).cache().exec(callback);
}

modelSchema.statics.count_all_offers_per_brand = function(page_id, callback) {
  callback = callback || function() {};
  this.count({is_auto: false, is_enabled: true, category: 'standard_offer', page_id: page_id}).cache().exec(callback);
}

modelSchema.statics.count_targeted_offers = function(page_id, query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {deliver_at: {$lte: now.valueOf()}, expired_at: {$gte: now.valueOf()}});
  _.extend(query, {page_id: page_id});
  _.extend(query, {is_enabled: true, category: 'standard_offer'});
  return this.search.apply(this, [query, options, callback]);
}

modelSchema.statics.get = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(options, {one: true});
  return this.search.apply(this, [{id: options.id}, options, callback]);
};

modelSchema.statics.get_one = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(options, {one: true});
  return this.search.apply(this, [{id: options.id}, options, callback]);
};

modelSchema.statics.all = function(query, options, callback) {
  callback = callback || function() {};
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.get_all = function(query, options, callback) {
  callback = callback || function() {};
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.get_offers_for_brand = function(query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {deliver_at: {$lte: now.valueOf()}, expired_at: {$gte: now.valueOf()}});
  _.extend(query, {is_enabled: true, category: 'standard_offer', 'targeting.mode': 'custom'});
  _.extend(options, {limit: 1000, sort: {expired_at: 1}});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_posts = function(query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {is_offer: false, page_id: query.page_id});
  _.extend(options, {sort: 'created_at'});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_posts_suggestions = function(query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {is_offer: false, not_page_id: query.not_page_id});
  _.extend(options, {sort: 'created_at'});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_offers_for_user = function(query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {deliver_at: {$lte: now.valueOf()}, expired_at: {$gte: now.valueOf()}});
  _.extend(query, {is_enabled: true, category: 'standard_offer', 'targeting.mode': 'custom'});
  _.extend(options, {limit: 1000, sort: {expired_at: 1}});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_requested_offers = function(query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {deliver_at: {$lte: now.valueOf()}, expired_at: {$gte: now.valueOf()}});
  _.extend(query, {is_enabled: true, category: 'standard_offer', 'targeting.mode': 'requests_only'});
  _.extend(options, {limit: 1000, sort: {expired_at: 1}});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_welcome_moments = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_enabled: true, category: 'welcome_moment'});
  _.extend(options, {limit: 1000, sort: {created_at: -1}});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_birthday_moments = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_enabled: true, category: 'birthday_moment'});
  _.extend(options, {limit: 1000, sort: {created_at: -1}});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_all_offers = function(query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {is_auto: false, is_enabled: true, category: 'standard_offer'});
  _.extend(options, {limit: 1000, sort: {expired_at: 1}});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.count_offers = function(query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {deliver_at: {$lte: now.valueOf()}, expired_at: {$gte: now.valueOf()}});
  _.extend(query, {is_enabled: true, category: 'standard_offer'});
  return this.count.apply(this, [this.build_query(query), options, callback]).cache();
};

modelSchema.methods.claim_code = function(callback) {
  var self = this;
  if(this.counters.claims < this.claim_limit) {
    this.update({$inc: {'counters.claims': 1}}, function(err, result) {
      callback(err, {redemption_code: self.redemption_code});
    });
  }
}

modelSchema.methods.disable = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_enabled: false}}, callback);
};

modelSchema.methods.enable = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_enabled: true}}, callback);
};


module.exports = mongoose.model(modelName, modelSchema);
