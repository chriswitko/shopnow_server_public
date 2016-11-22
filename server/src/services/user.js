var _ = require('lodash');
var async = require('async');
var moment = require('moment-timezone')
var kue = require('kue');
var queue = kue.createQueue();

var config = require('../config/config.js');

var myError = require('../local_modules/myerror');
var Facebook = require('../local_modules/facebook');
var Helper = require('../local_modules/helper');

var User = require('../models').User;
var UserLike = require('../models').UserLike;
var Offer = require('../models').Offer;
var Post = require('../models').Post;
var UserOffer = require('../models').UserOffer;
var Page = require('../models').Page;
var InsightDaily = require('../models').InsightDaily;
var InsightMonthly = require('../models').InsightMonthly;

var baseService = require('./base');
_.extend(User.prototype, baseService);

User.prototype.add_like = function(page, callback) {
  self = this;
  callback = callback || function() {};
  if(!page.facebook_id) {
    return callback(myError('Missing page_id param or wrong value'));
  }
  UserLike.add_like(self.facebook_id, page.facebook_id, callback);
}

User.prototype.add_admin_page = function(page, callback) {
  self = this;
  callback = callback || function() {};
  if(!page.facebook_id) {
    return callback(myError('Missing page_id param or wrong value'));
  }
  self.update({$addToSet: {admin_pages: page.facebook_id}}, callback);
}

User.schema.custom('offers', {acl: 'owner'}, function(query, options, callback) {
  self = this;
  callback = callback || function() {};
  Offer.get_offers({'targeting.age_from': self.age, 'targeting.age_to': self.age, 'targeting.gender': self.gender}, {schema: 'default'}, function(err, result, paging, summary) {
    async.forEach(result, function(offer, next) {
      UserOffer.add_event(self.facebook_id, offer._id, 'fetch', '', next);
    }, function() {
      var temp = _.map(result, function(offer) { 
        return offer.toSchema();
      })
      callback(null, Helper.clean_json({data: temp, paging: paging, summary: summary}));
    })
  });
});

User.schema.custom('posts', {acl: 'owner'}, function(query, options, callback) {
  self = this;
  callback = callback || function() {};
  Post.get_posts({page_id: self.subscribed_pages || []}, {schema: 'default', after: options.after, limit: 20}, function(err, result, paging, summary) {
    var temp = _.map(result, function(post) { 
      return post.post_id;
    })
    callback(null, Helper.clean_json({data: temp, paging: paging, summary: summary}));
  });
});

User.schema.custom('posts_suggestions', {acl: 'owner'}, function(query, options, callback) {
  self = this;
  callback = callback || function() {};
  Post.get_posts_suggestions({not_page_id: self.subscribed_pages || []}, {schema: 'default', after: options.after}, function(err, result, paging, summary) {
    var temp = _.map(result, function(post) { 
      return post.post_id;
    })
    callback(null, Helper.clean_json({data: temp, paging: paging, summary: summary}));
  });
});

User.schema.custom('subscriptions_with_offers', {acl: 'owner'}, function(query, options, callback) {
  var self = this;
  callback = callback || function() {};
  if(options.sort) {
    options.sort_temp = options.sort;
    options.sort = {}
    options.sort[options.sort_temp] = -1; 
  } else {
    options.sort = {random: 1};
  }
  var offers = [];
  var pages_ids = [];

  var now = new Date().valueOf();
  var then = options.user.created_at;
  var day = moment().utc().format('D');
  var month = moment().utc().format('M');
  var user_created_days_ago = moment.duration(moment(now).diff(then)).days();

  self.subscribed_pages = self.subscribed_pages.length ? self.subscribed_pages : [''];
  // console.log('self.subscribed_pages', self.subscribed_pages);
  var get_standard_offers = Offer.get_offers_for_user.bind(Offer, {'targeting.age_from': self.age, 'targeting.age_to': self.age, 'targeting.gender': self.gender, page_id: self.subscribed_pages.join(',')}, {schema: 'default'});
  var get_requested_offers = Offer.get_requested_offers.bind(Offer, {'targeting.user_ids': self.facebook_id, page_id: self.subscribed_pages.join(',')}, {schema: 'default'});
  var get_welcome_moments = Offer.get_welcome_moments.bind(Offer, {page_id: self.subscribed_pages.join(',')}, {schema: 'default'});
  var get_birthday_moments = Offer.get_birthday_moments.bind(Offer, {page_id: self.subscribed_pages.join(',')}, {schema: 'default'});
  
  var tasks = [];
      tasks.push(get_standard_offers);
      tasks.push(get_requested_offers);
      if(user_created_days_ago <= 3) {
        tasks.push(get_welcome_moments);
      }
      if(options.user.birth_date === day && options.user.birth_month === month) {
        tasks.push(get_birthday_moments);
      }

  async.parallel(tasks, function(err, result) {
    var all = [];
    if(result) {
      result.forEach(function(el, idx) {
        if(result[idx] && result[idx].length && result[idx][0]) {
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
    }

    async.forEach(all, function(offer, next) {
      if(!(offer.page_id in offers)) {
        offers[offer.page_id] = [];
      }
      offers[offer.page_id].push(offer.toSchema());
      pages_ids.push(offer.page_id);
      next();
    }, function() {
      _.extend(query, {facebook_id: {$in: pages_ids}});
      Page.pages(query, {schema: 'default', summary: true, limit: 1000, after: options.after, sort: options.sort}, function(err, result, paging, summary) {
        format_page_output(result, {subscribed_pages: self.subscribed_pages, requested_pages: self.requested_pages, user: options.user}, function(err, output) {
          output = _.map(output, function(page) {
            page.offers = {data: offers[page.facebook_id]};
            return page;
          });
          callback(err, {data: _.sortBy(output, 'offers.data[0].expired_at'), paging: paging, summary: summary});
        })
      });
    });
  });
});

var format_page_output = function(result, options, callback) {
  var temp = [];
  async.forEachSeries(result, function(page, next) {
    page.query({facebook_id: page.facebook_id}, {schema: 'owner', user: options.user, fields: options.fields || ['facebook_id','username','name','description','link','picture','cover','counters','is_subscribed','is_activated','is_verified','insights','geo']}, function(err, output) {
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

User.schema.custom('shared_subscriptions', {acl: 'owner'}, function(query, options, callback) {
  var self = this;
  callback = callback || function() {};

  _.extend(query, {facebook_id: {$in: this.shared_pages}});

  Page.pages(query, {schema: 'default', summary: true, after: options.after, sort: options.sort, limit: options.limit}, function(err, result, paging, summary) {
    format_page_output(result, {subscribed_pages: self.subscribed_pages, requested_pages: self.requested_pages, user: options.user, sort: options.sort, limit: options.limit}, function(err, output) {
      callback(err, {data: output, paging: paging, summary: summary});
    })
  });
});

User.schema.custom('saved', {acl: 'owner'}, function(query, options, callback) {
  var self = this;
  callback = callback || function() {};

  var posts = this.saved_posts || [];
  // posts.reverse();
  posts = posts.slice(0, 50);
  callback(null, {data: posts || []});
});

User.schema.custom('subscriptions', {acl: 'owner'}, function(query, options, callback) {
  var self = this;
  callback = callback || function() {};
  _.extend(query, {facebook_id: {$in: this.subscribed_pages}});
  self.import_likes({loop: false, max: 20, skip: true}, function() {
    self.mark_synched();
  });
  Page.pages(query, {schema: 'default', summary: true, after: options.after, sort: 'last_auto_offers_synch_at', limit: options.limit}, function(err, result, paging, summary) {
    format_page_output(result, {subscribed_pages: self.subscribed_pages, requested_pages: self.requested_pages, user: options.user, sort: options.sort, limit: options.limit}, function(err, output) {
      callback(err, {data: output, paging: paging, summary: summary});
    })
  });
});

function getPaginatedItems(items, page) {
	var page = page || 1,
	    per_page = 20,
	    offset = (page - 1) * per_page,
	    paginatedItems = items.slice(offset, offset + per_page);//_.rest(items, offset).slice(0, per_page);
	return {
		page: page,
		per_page: per_page,
		total: items.length,
		total_pages: Math.ceil(items.length / per_page),
		data: paginatedItems
	};
}

User.schema.custom('discover', {acl: 'owner'}, function(query, options, callback) {
  var self = this;
  var friends_ids = [];
  var subscribed_pages = this.subscribed_pages || [];
  var output = [];
  callback = callback || function() {};

  Facebook.friends({userID: self.facebook_id, access_token: self.access_token}, function(err, friends) {
    friends_ids = _.map(friends, function(friend) {
      return friend.id;
    });

    User.get_enabled({facebook_id: {$in: friends_ids}}, {}, function(err, users) {
      users = users || [];
      users.forEach(function(user) {
        if(user.subscribed_pages) {
          subscribed_pages = subscribed_pages.concat(user.subscribed_pages);    
        }
      });
      var pagination = getPaginatedItems(_.uniq(subscribed_pages), options.after);
      _.extend(query, {facebook_id: {$in: pagination.data}});
      Page.pages(query, {schema: 'default', summary: true, after: 1, sort: 'last_auto_offers_synch_at', limit: options.limit || 20}, function(err, result, paging, summary) {
        format_page_output(result, {subscribed_pages: self.subscribed_pages, requested_pages: self.requested_pages, user: options.user, sort: 'updated_at', limit: options.limit, fields: options.simplified ? ['facebook_id'] : []}, function(err, output) {
          callback(err, {data: output, paging: paging, summary: summary});
        })
      });
    });
  });
});

User.schema.custom('recommended', {acl: 'owner'}, function(query, options, callback) {
  var self = this;
  var friends_ids = [];
  var subscribed_pages = this.subscribed_pages || [];
  var unsubscribed_pages = this.unsubscribed_pages || [];
  var output = [];
  callback = callback || function() {};
  var tags = [];
  tags.push('tag:promoted');  

  _.extend(query, {facebook_id: {$nin: subscribed_pages.concat(unsubscribed_pages)}});
  if(self.gender && (self.gender === 'male' || self.gender === 'female')) {
    tags.push('tag:' + self.gender);
  }
  
  _.extend(query, {tags: {$all: tags}});
  console.log('query', query);
  Page.pages(query, {schema: 'default', summary: true, after: 1, sort: 'random', limit: options.limit || 20}, function(err, result, paging, summary) {
    format_page_output(result, {subscribed_pages: self.subscribed_pages, requested_pages: self.requested_pages, user: options.user, limit: options.limit, fields: options.simplified ? ['facebook_id'] : []}, function(err, output) {
      callback(err, {data: output, paging: paging, summary: summary});
    })
  });
});

User.schema.custom('subscriptions_active', {acl: 'owner'}, function(query, options, callback) {
  var self = this;
  callback = callback || function() {};
  if(options.sort) {
    options.sort_temp = options.sort;
    options.sort = {}
    options.sort[options.sort_temp] = -1; 
  } else {
    options.sort = {random: 1};
  }
  _.extend(query, {facebook_id: {$in: this.subscribed_pages}});
  Page.activated(query, {schema: 'default', summary: true, after: options.after, sort: options.sort}, function(err, result, paging, summary) {
    format_page_output(result, {subscribed_pages: self.subscribed_pages, requested_pages: self.requested_pages, user: options.user}, function(err, output) {
      callback(err, {data: output, paging: paging, summary: summary});
    })
    // var temp = _.map(result, function(page) {
    //   return page.toSchema();
    // }) 
    // callback(err, {data: temp, paging: paging, summary: summary});
  });
});

User.schema.custom('count_subscriptions', {acl: 'owner'}, function(query, options, callback) {
  var self = this;
  callback = callback || function() {};
  callback(null, self.subscribed_pages.length);
});

// User.prototype.count_subscriptions = function(query, options, callback) {
//   console.log('count');
//   var self = this;
//   callback = callback || function() {};
//   callback(null, self.subscribed_pages.length);
// }

User.schema.custom('is_admin', {acl: 'owner'}, function(query, options, callback) {
  callback = callback || function() {};
  callback(null, !!~this.roles.indexOf('admin') || !!~config.app.admin_emails.indexOf(this.email));
});

User.schema.custom('insights', {acl: 'owner', alias: 'counters_live'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};
  async.parallel({
    subscriptions: self.count_subscriptions.bind(self, {}, {}),
    likes: UserLike.count_likes.bind(UserLike, self.facebook_id),
    offers: Offer.count_offers.bind(Offer, {'targeting.age': self.age, 'targeting.gender': self.gender})
  }, function(err, counters) {
    if(err) {
      return callback(err);
    }
    self.update_object({counters: counters}, callback.apply(this, [null, counters]))
  });
})

User.prototype.ask_for_discount = function(page_id, callback) {
  var self = this;
  callback = callback || function() {};

  self.update({$addToSet: {requested_pages: page_id}}, function(err, result) {
    if (result.nModified || result.upserted) {
      async.parallel([
        InsightDaily.log.bind(InsightDaily, new Date(), 'page', page_id, 'requests', true),
        InsightMonthly.log.bind(InsightMonthly, new Date(), 'page', page_id, 'requests', true)
      ], function() {
        callback(null, result); 
      })
    } else {
      callback(null, result); 
    }
  });
};

User.prototype.unshare_page = function(page_id, callback) {
  var self = this;
  callback = callback || function() {};
  self.update({$pull: {shared_pages: page_id}}, function(err, result) {
    callback(null, result); 
  });
};

User.prototype.unsave_post = function(post_id, callback) {
  var self = this;
  callback = callback || function() {};
  self.update({$pull: {saved_posts: post_id}}, function(err, result) {
    callback(null, result); 
  });
};

User.prototype.add_subscription = function(page, callback) {
  var self = this;
  callback = callback || function() {};
  if(!(page instanceof Object)) {
    page = {
      facebook_id: page,
      is_verified: true
    }
  }
  if(!page.is_verified) {
    return callback(null);
  }
  self.update({$addToSet: {subscribed_pages: page.facebook_id}, $pull: {unsubscribed_pages: page.facebook_id}}, function(err, result) {
    if (result.nModified || result.upserted) {
      async.parallel([
        self.add_like.bind(self, page),
        InsightDaily.log.bind(InsightDaily, new Date(), 'page', page.facebook_id, 'subscribe', true),
        InsightMonthly.log.bind(InsightMonthly, new Date(), 'page', page.facebook_id, 'subscribe', true)
      ], function() {
        callback(null, result); 
      })
    } else {
      callback(null, result); 
    }
  });
};

User.prototype.register_device = function(token, platform, onesignal_id, callback) {
  var self = this;
  callback = callback || function() {};
  self.update({$set: {onesignal_id: onesignal_id}, $addToSet: {devices: {token: token, platform: platform}}}, function(err, result) {
    if (result.nModified || result.upserted) {
      callback(null, result); 
    } else {
      callback(null, result); 
    }
  });
};

User.prototype.remove_subscription = function(page, callback) {
  var self = this;
  callback = callback || function() {};
  if(!(page instanceof Object)) {
    page = {
      facebook_id: page,
      is_verified: true
    }
  }
  if(!page.facebook_id) {
    return callback(myError('Missing page_id param or wrong value'));
  }
  self.update({$addToSet: {unsubscribed_pages: page.facebook_id}, $pull: {subscribed_pages: page.facebook_id}}, callback);
};

User.prototype.add_managed_page = function(page_id, callback) {
  // User.add_managed_page();
  // Page.add_team_player();
  callback = callback || function() {};
  callback(); 
};

User.prototype.get_managed_pages = function(query, options, callback) {
  callback = callback || function() {};
  callback(null, [
    {'pageID': '321'}
  ]);
}

User.prototype.upgrade_plan = function(options, callback) {
  Page.upgrade_plan(options, callback);
}

User.prototype.get_offers = function(page, callback) {
  var job = queue.create('refresh_offers', {
    page: page
  }).save( function(err){
    if( !err ) console.log( job.id );
    callback(err);
  });
}

var parse_likes = function(result, done) {
  var self = this;
  var verified = 0;
  var unverified = 0;
  var approved_categories = ['clothing', 'clothing store', 'home decor', 'furniture', 'jewelry/watches', 'outdoor gear/sporting goods', 'toy store', "men's clothing store", "women's clothing store", 'bike shop', 'sporting goods store', 'shoe store'];

  if(!result || !result.likes) {
    return done(result, done);        
  }
  async.forEachSeries(result.likes, function(like, next) {
    if(!like.name) {
      return next();
    }
    if(!like.is_verified && like.facebook_category) {
      like.is_verified = !!~approved_categories.indexOf(like.facebook_category.toLowerCase());
      like.is_enabled = like.is_verified;
      if(like.is_verified) {
        verified++;
      } else {
        unverified++;
      }
    }
    if(!self.unsubscribed_pages || self.unsubscribed_pages.indexOf(like.facebook_id) === -1) {
      if(like.is_verified) {
        async.parallel([
          Page.create_object.bind(Page, {id: like.facebook_id, data: like, skip: true}),
          self.get_offers.bind(self, like),
          self.add_like.bind(self, like),
          self.add_subscription.bind(self, like)
          // add parsing offers per store
        ], next)
      } else {
        async.parallel([
          self.add_like.bind(self, like),
        ], next)
      }
    } else {
      next();
    }
  }, function() {
    done(null, {verified: verified, unverified: unverified});
  });
}

var parse_accounts = function(result, done) {
  var self = this;
  var verified = 0;
  var unverified = 0;
  var approved_categories = ['clothing', 'clothing store', 'home decor', 'furniture', 'jewelry/watches', 'outdoor gear/sporting goods', 'toy store', "men's clothing store", "women's clothing store", 'bike shop', 'sporting goods store', 'shoe store'];

  if(!result || !result.likes) {
    return done(result, done);        
  }
  async.forEachSeries(result.likes, function(like, next) {
    if(!like.is_verified && like.facebook_category) {
      like.is_verified = !!~approved_categories.indexOf(like.facebook_category.toLowerCase());
      like.is_enabled = like.is_verified;
      if(like.is_verified) {
        verified++;
      } else {
        unverified++;
      }
    }
    async.parallel([
      Page.create_object.bind(Page, {id: like.facebook_id, data: like, skip: true}),
      self.add_admin_page.bind(self, like),
    ], next)
  }, function() {
    done(null, {verified: verified, unverified: unverified});
  });
}

User.prototype.import_accounts = function(options, callback) {
  var self = this;
  
  callback = callback || function() {};
  
  async.waterfall([
    Facebook.accounts.bind(Facebook, {user_id: self.facebook_id, access_token: self.access_token}),
    parse_accounts.bind(self)
  ], function(err, result) {
    callback(err, result)
  });
}

User.prototype.import_likes = function(options, callback) {
  var self = this;
  
  callback = callback || function() {};
  // if(self.email === self.facebook_id) {
  //   callback(null, []);
  // }
  
  async.waterfall([
    Facebook.likes.bind(Facebook, {user_id: self.facebook_id, access_token: self.access_token, loop: options.loop, max: options.max}),
    parse_likes.bind(self)
  ], function(err, result) {
    callback(err, result)
  });
}

User.prototype.is_admin = User.schema.statics.is_admin;
User.prototype.insights = User.schema.statics.insights;
User.prototype.subscriptions =  User.schema.statics.subscriptions;
User.prototype.discover =  User.schema.statics.discover;
User.prototype.saved =  User.schema.statics.saved;
User.prototype.shared_subscriptions =  User.schema.statics.shared_subscriptions;
User.prototype.subscriptions_active =  User.schema.statics.subscriptions_active;
User.prototype.subscriptions_with_offers =  User.schema.statics.subscriptions_with_offers;
User.prototype.count_subscriptions =  User.schema.statics.count_subscriptions;
User.prototype.offers = User.schema.statics.offers;
User.prototype.posts = User.schema.statics.posts;
User.prototype.recommended = User.schema.statics.recommended;
User.prototype.posts_suggestions = User.schema.statics.posts_suggestions;
User.prototype.managed_pages = User.prototype.get_managed_pages;
User.prototype.basic = User.get_me.bind(User);

module.exports = User;