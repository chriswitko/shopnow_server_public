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
  user_id: {type: String, trim: true, fulltext: true, index: true},
  post_id: {type: String, trim: true, fulltext: true, index: true, acl: 'default'},
  category: {type: String, trim: true, default: 'standard_offer', required: true, acl: 'default'},
  title: {type: String, trim: true, required: true, fulltext: true, acl: 'default'},
  message: {type: String, trim: true, fulltext: true, acl: 'default'},
  terms: {type: String, trim: true, acl: 'default'},
  badge: {type: String, trim: true, acl: 'default'},
  badge_color: {type: String, trim: true, default: '#42A5F5', acl: 'default'},
  redemption_code: {type: String, trim: true, fulltext: true, acl: 'default'},
  claim_limit: {type: Number, default: 0},
  coupon_type: {type: String, enum: ['in_store_only', 'in_store_and_online', 'online_only'], default: 'in_store_and_online'},
  link: {
    type: String, 
    trim: true, 
    acl: 'default',
    get: function(url) {
      if (!url) {
        return url;
      } else {
        if (url.indexOf('http://') !== 0   && url.indexOf('https://') !== 0) {
          url = 'http://' + url;
        }
        return url;
      }
    }
  },
  picture: {
    type: String, 
    trim: true,
    acl: 'default',
    get: function(url) {
      if (!url) {
        return url;
      } else {
        if (url.indexOf('http://') !== 0   && url.indexOf('https://') !== 0) {
          url = 'http://' + url;
        }
        return url;
      }
    }
  },
  targeting: {
    user_ids: [],
    mode: {type: String, trim: true, enum: ['custom', 'requests_only'], default: 'custom', acl: 'default'},
    gender: [{type: String, trim: true, enum: ['male', 'female', 'kids', 'unknown'], default: 'unknown'}],
    age_from: {type: Number, default: 0},
    age_to: {type: Number, default: 100}
  },
  counters: {
    estimated: {type: Number, default: 0},
    total: {type: Number, default: 0}, // total sent pushes
    fetches: {type: Number, default: 0},
    delivers: {type: Number, default: 0},
    opens: {type: Number, default: 0},
    views: {type: Number, default: 0},
    clicks: {type: Number, default: 0},
    claims: {type: Number, default: 0}, // get the code
    redeems: {type: Number, default: 0} // open the code
  },
  business_counters: {
    ctr: {type: Number, default: 0}
  },
  timezone: {type: String, trim: true, default: 'Europe/London', acl: 'default'},
  status: {type: String, trim: true, enum: ['draft', 'paid', 'canceled', 'paused'], default: 'draft', acl: 'default'},
  is_auto: {type: Boolean, default: false, acl: 'default'},
  is_enabled: {type: Boolean, default: true, acl: 'default'}, // support when brand would like to disable auto-suggested offer
  valid_days: {type: Number, default: 1, acl: 'default'},
  expired_at: {type: Date, acl: 'default'},
  deliver_at: {type: Date, default: Date.now},
  created_at: {type: Date, default: Date.now, acl: 'default'},
  updated_at: {type: Date, default: Date.now}
});

modelSchema.tree._id.acl = 'default';
modelSchema.tree.targeting.acl = 'default';
modelSchema.tree.counters.acl = 'default';

// virtual: redeems_left(max - counter.redeems), business_counters(ctr etc)

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

modelSchema.statics.get_offers = function(query, options, callback) {
  callback = callback || function() {};
  var now = new Date();
  _.extend(query, {deliver_at: {$lte: now.valueOf()}, expired_at: {$gte: now.valueOf()}});
  _.extend(query, {is_auto: false, is_enabled: true, category: 'standard_offer', 'targeting.mode': 'custom'});
  _.extend(options, {limit: 1000, sort: {expired_at: 1}});
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
