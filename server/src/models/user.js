var _ = require('lodash');
var async = require('async');
var mongoose = require('../local_modules/mongoose-fill');//require('mongoose');
var Schema = mongoose.Schema;

var Helper = require('../local_modules/helper');
var myError = require('../local_modules/myerror');

var baseSchema = require('./base');
var modelName = Helper.build_module_name(__filename);
    
var modelSchema = baseSchema.extend({
  facebook_id: {type: String, required: true, trim: true, unique: true, index: true, acl: 'default'},
  email: {type: String, required: true, trim: true},
  password: {type: String, trim: true},
  first_name: {type: String, trim: true, fulltext: true, acl: 'default'},
  last_name: {type: String, trim: true, fulltext: true, acl: 'default'},
  gender: {type: String, trim: true, enum: ['male', 'female', 'unknown'], default: 'unknown', acl: 'default'},
  link: {
    type: String, 
    trim: true, 
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
  locale: {type: String, trim: true},
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
  location: {type: String, trim: true},
  country: {type: String,  default: 'unknown', trim: true, fulltext: true}, 
  city: {type: String, default: 'unknown', trim: true, fulltext: true}, // add set/get
  source: {type: String, default: 'facebook', trim: true}, // facebook/email
  phone: {type: String, trim: true, acl: 'owner'},
  job_title: {type: String, trim: true, acl: 'owner'},
  billing_address: {
    name: {type: String, default: '', trim: true},
    addressLine1: {type: String, default: '', trim: true},
    addressLine2: {type: String, default: '', trim: true},
    zip: {type: String, default: '', trim: true},
    state: {type: String, default: '', trim: true},
    city: {type: String, default: '', trim: true},
    country: {type: String, default: 'UK', trim: true},
    vat: {type: String, default: '', trim: true}
  },
  vat_rate: {type: Number, default: 20.00},
  customer_valid_vat_number: {type: Boolean, default: false, acl: 'default'},
  stripe_id: {type: String, trim: true},
  birthday: {type: String, trim: true},
  birth_date: {type: Number, default: 0, acl: 'owner'},
  birth_month: {type: Number, default: 0, acl: 'owner'},
  birth_year: {type: Number, default: 0},
  age: {type: Number, default: 0, acl: 'admin'},
  access_token: {type: String, trim: true, acl: 'owner'},
  app_version: {type: String, trim: true},
  enabled_notifications: {type: Boolean, default: true, acl: 'owner'},
  is_business: {type: Boolean, default: false, acl: 'owner'},
  is_enabled: {type: Boolean, default: true, acl: 'owner'},
  is_ready: {type: Boolean, default: false, acl: 'owner'},
  is_synched: {type: Boolean, default: false, acl: 'owner'},
  is_synched_business: {type: Boolean, default: false, acl: 'owner'},
  has_errors: {type: Boolean, default: false, acl: 'owner'},
  created_at: {type: Date, default: Date.now, acl: 'owner'},
  updated_at: {type: Date, default: Date.now, acl: 'owner'},
  last_push_at: Date, // last push message
  last_access_at: Date,
  roles: [{type: String, enum: ['user', 'admin'], acl: 'default'}],
  onesignal_id: {type: String, trim: true},  
  counters: {
    likes: {type: Number, default: 0},
    subscriptions: {type: Number, default: 0},
    friends: {type: Number, default: 0},
    offers: {type: Number, default: 0}
  },
  admin_pages: [], // add ref
  subscribed_pages: [], // add ref
  unsubscribed_pages: [], // add ref
  shared_pages: [], // add ref
  saved_posts: [], // add ref
  delivered_offers: [],
  requested_pages: [], // add ref
  devices: [],
  tokens: []
});

modelSchema.tree.roles.acl = 'default';
modelSchema.tree.counters.acl = 'owner';
modelSchema.tree.billing_address = 'owner';

modelSchema.custom('name', {acl: 'default'}, function(callback) {
  callback = callback || function() {};
  return callback(null, ((this.first_name ? this.first_name : '') + ' ' + (this.last_name ? this.last_name : '')).trim());
});

// modelSchema.virtual('is_admin').get(function() {
//   return !!~this.roles.indexOf('admin');
// });

modelSchema.pre('save', function(next) {
  var self = this;
  
  if(this.location) {
    self.city = this.location.split(',').length > 1 ? this.location.split(',')[0].trim() : 'unknown';
    self.country = this.location.split(',').length > 1 ? this.location.split(',')[1].trim() : 'unknown';
  }
  
  if(self.birthday) {
    var currentYear = new Date().getFullYear();
    self.birth_date = self.birthday.substr(0, 2);
    self.birth_month = self.birthday.substr(3, 2);
    self.birth_year = self.birthday.substr(6, 4);
    
    if(self.birth_year) {
      self.age = currentYear - self.birth_year;
    }
  }
  
  if(!self.roles.length) {
    self.roles.push('user');
  }

  next();
});

modelSchema.statics.set_admins = function(emails, callback) {
  emails = emails || [];
  callback = callback || function() {};
  this.update({'email': {$in: emails}}, {$addToSet: {roles: 'admin'}}, {multi: true}, callback);
};

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

modelSchema.statics.raw = function(query, options, callback) {
  console.log('hello');
  callback = callback || function() {};
  _.extend(options, {one: true, raw: true, timeout: -1});
  return this.search.apply(this, [{facebook_id: options.facebook_id}, options, callback]);
};

modelSchema.statics.get_me = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(options, {one: true});
  return this.search.apply(this, [{facebook_id: options.facebook_id}, options, callback]);
};

modelSchema.statics.get_requests_by_page = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {requested_pages: {$in: [options.page_id]}});
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.count_all_requests = function(callback) {
  callback = callback || function() {};
  this.count({requested_pages : {$exists:true}, $where:'this.requested_pages.length>1'}).cache().exec(callback);
}

modelSchema.statics.count_requests_by_page = function(page_id, callback) {
  callback = callback || function() {};
  this.count({requested_pages: {$in: [page_id]}}).cache().exec(callback);
}

modelSchema.statics.count_all = function(callback) {
  callback = callback || function() {};
  this.count({}).cache().exec(callback);
}

modelSchema.statics.count_subscribers = function(page_id, callback) {
  callback = callback || function() {};
  this.count({subscribed_pages: {$in: [page_id]}}).cache().exec(callback);
}

modelSchema.statics.get_subscribers = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {subscribed_pages: [options.page_id]});
  // console.log('query', query);
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.get_all = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {facebook_id: {$exists: true}});
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

modelSchema.statics.get_not_synched = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {has_errors: false, $or: [{is_synched: false}, {is_ready: false}]});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_not_synched_business = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {has_errors: false, $or: [{is_synched_business: false}]});
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_enabled = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_enabled: true})
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_disabled = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {is_enabled: false})
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.statics.get_admins = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(query, {roles: {$in : ['admin']}})
  return this.search.apply(this, [query, options, callback]);
};

modelSchema.methods.add_role = function(role, callback) {
  var self = this;
  callback = callback || function() {};
  if(!role || !~self.schema.path('roles').options.type[0].enum.indexOf(role)) {
    return callback(myError('Missing role param or wrong value'));
  }
  self.update({$addToSet: {roles: role}}, callback);
};

modelSchema.methods.share_page = function(page_id, callback) {
  var self = this;
  callback = callback || function() {};
  self.update({$addToSet: {shared_pages: page_id}}, callback);
};

modelSchema.methods.save_post = function(post_id, callback) {
  var self = this;
  callback = callback || function() {};
  self.update({$addToSet: {saved_posts: post_id}}, callback);
};

modelSchema.methods.mark_not_ready = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_ready: false}}, callback);
};

modelSchema.methods.mark_ready = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_ready: true}}, callback);
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

modelSchema.methods.mark_has_errors = function(callback) {
  callback = callback || function() {};
  this.update({$set: {has_errors: true}}, callback);
};

modelSchema.methods.mark_has_no_errors = function(callback) {
  callback = callback || function() {};
  this.update({$set: {has_errors: false}}, callback);
};

modelSchema.methods.mark_synched = function(callback) {
  callback = callback || function() {};
  this.update({$set: {is_synched: true}}, callback);
};

modelSchema.methods.enable_notifications = function(callback) {
  callback = callback || function() {};
  this.update({$set: {enabled_notifications: true}}, callback);
};

modelSchema.methods.disable_notifications = function(callback) {
  callback = callback || function() {};
  this.update({$set: {enabled_notifications: false}}, callback);
};

modelSchema.statics.internalModelName = function(callback) {
  callback = callback || function() {};
  return modelName;
};

module.exports = mongoose.model(modelName, modelSchema);
