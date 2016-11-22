var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Helper = require('../local_modules/helper');
var myError = require('../local_modules/myerror');

var baseSchema = require('./base');
var modelName = Helper.build_module_name(__filename);

var modelSchema = baseSchema.extend({
  facebook_id: {type: String, required: true, trim: true, fulltext: true, unique: true, index: true, acl: 'default'},
  facebook_category: {type: String, trim: true, fulltext: true, acl: 'default'},
  categories: [{type: String, trim: true}],
  email: {type: String, trim: true},
  username: {type: String, trim: true, fulltext: true, acl: 'default'},
  name: {type: String, trim: true, fulltext: true, acl: 'default'},
  description: {type: String, trim: true, fulltext: true, acl: 'default'},
  likes: {type: Number, default: 0},
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
  cover: {
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
    gender: {type: String, trim: true, enum: ['male', 'female', 'kids', 'unknown'], default: 'unknown'},
    age_from: {type: Number, default: 0},
    age_to: {type: Number, default: 100}
  },
  counters: {
    subscribers: {type: Number, default: 0},
    all_offers: {type: Number, default: 0},
    active_offers: {type: Number, default: 0},
    targeted_offers: {type: Number, default: 0},
    requests: {type: Number, default: 0},
    clicks: {type: Number, default: 0},
    views: {type: Number, default: 0},
    delivers: {type: Number, default: 0}
  },
  business_counters: {
    offers: {type: Number, default: 0}
  },
  plan: {type: String, trim: true, enum: ['free', 'basic', 'premium'], default: 'free', acl: 'default'}, 
  admin_users: [],
  tags: {
    type: Array,
    get: function(tags) {
      return tags.join(', ');
    }
  },
  active_moments: {
    welcome_moment: {type: String, trim: true},
    birthday_moment: {type: String, trim: true}
  }, //BIRTHDAY: {offer_id: 'xxx'}
  stripe_cust_id: {type: String, trim: true},
  stripe_subs_id: {type: String, trim: true},
  timezone: {type: String, trim: true, default: 'Europe/London'},
  city: {type: String, trim: true, fulltext: true},
  country: {type: String, trim: true, fulltext: true},
  street: {type: String, trim: true, fulltext: true},
  zip: {type: String, trim: true, fulltext: true},
  geo: { type: [Number], index: '2dsphere', acl: 'default'},
  access_token: {type: String, trim: true},
  // is_subscribed: {type: Boolean, default: false, acl: 'default'},
  // is_requested: {type: Boolean, default: false, acl: 'default'},
  is_activated: {type: Boolean, default: false, acl: 'default'},
  is_enabled: {type: Boolean, default: true, acl: 'default'},
  is_verified: {type: Boolean, default: false, acl: 'default'},
  is_synched: {type: Boolean, default: false, acl: 'default'},
  created_at: {type: Date, default: Date.now, acl: 'owner'},
  updated_at: {type: Date, default: Date.now, acl: 'owner'},
  last_auto_offers_synch_at: {type: Date}
});

modelSchema.tree.counters.acl = 'default';
modelSchema.tree.active_moments.acl = 'default';
modelSchema.tree.tags.acl = 'default';
// modelSchema.tree.is_subscribed.acl = 'default';

modelSchema.statics.find_by_id = function (element_id, callback) {
  callback = callback || function() {};
  if(!element_id || !callback) {
    return callback('Missing element_id or callback');
  }
  this.findOne({ 'facebook_id': element_id }).exec(function(err, element) {
    if(err) {
      return callback(err);
    }
    if(!element) {
      return callback(); // 'User does not exists' but it's not error
    }
    callback(null, element);
  });
};

modelSchema.statics.import_bulk = function(array, callback) {
  this.create(array, callback);
}

modelSchema.statics.get_me = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(options, {one: true});
  return this.search.apply(this, [{facebook_id: options.facebook_id}, options, callback]);
};

modelSchema.statics.get_public = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(options, {one: true});
  console.log({username: options.facebook_id});
  return this.search.apply(this, [{username: options.facebook_id}, options, callback]);
};

modelSchema.statics.count_all = function(callback) {
  callback = callback || function() {};
  this.count({}).cache().exec(callback);
}

modelSchema.statics.all = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {facebook_id: {$exists: true}});
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.pages = function(query, options, callback) {
  callback = callback || function() {};
  // _.extend(query, {facebook_id: {$exists: true}});
  _.extend(query, {is_verified: true})
  _.extend(query, {is_enabled: true})
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.enabled = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_enabled: true})
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.disabled = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_enabled: false})
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.activated = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_activated: true})
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.deactivated = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_activated: false})
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.verified = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_verified: true})
  _.extend(options, {sort: 'last_auto_offers_synch_at', sort_order: 1});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.methods.mark_not_active = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_activated: false}}, callback);
};

modelSchema.methods.mark_active = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_activated: true}}, callback);
};

modelSchema.methods.mark_disabled = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_enabled: false}}, callback);
};

modelSchema.methods.mark_enabled = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_enabled: true}}, callback);
};

modelSchema.methods.mark_not_synched = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_synched: false}}, callback);
};

modelSchema.statics.upgrade_plan = function(options, callback) {
  callback = callback || function() {};
  this.update({facebook_id: options.metadata.page_id}, {$set: {plan: options.metadata.package, stripe_cust_id: options.id, stripe_subs_id: options.subscriptions.data[0].id}}, callback);
};

modelSchema.statics.cancel_plan = function(options, callback) {
  callback = callback || function() {};
  this.update({$set: {plan: 'free', stripe_cust_id: '', stripe_subs_id: ''}}, callback);
};

modelSchema.methods.mark_synched = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_synched: true}}, callback);
};

module.exports = mongoose.model(modelName, modelSchema);
