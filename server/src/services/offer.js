var _ = require('lodash');
var async = require('async');

var Helper = require('../local_modules/helper');

var User = require('../models').User;
var Page = require('../models').Page;
var Offer = require('../models').Offer;
var UserOffer = require('../models').UserLike;
var Insight = require('../models').Insight;

var baseService = require('./base');
_.extend(Offer.prototype, baseService);

// Offer.schema.fill('page', {acl: 'default'}, function(callback) {
//   callback = callback || function() {};
//   return Page.get({}, {facebook_id: this.page_id}, function(err, page) {
//     callback(err, page.toSchema());
//   });
// });

// Offer.prototype.get_estimate_target = function(query, options, callback) {
//   // add connection to Notifications so we can knew what has been already delivered
//   var self = this;
//   callback = callback || function() {};
//   User.get_enabled({age: [self.targeting.age_from, self.targeting.age_to], gender: self.targeting.gender, subscribed_pages: [self.page_id]}, {schema: 'user_default'}, function(err, result, paging, summary) {
//     var output = [];
//     _.map(result, function(user) {
//       output.push(user.toSchema('user_default', ['facebook_id']).facebook_id);
//     })
//     callback(err, Helper.clean_json({data: output, paging: paging, summary: summary}));
//   });
// }

Offer.schema.custom('estimated', {acl: 'default', alias: 'counters_live'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};

  if(self.category === 'standard_offer') {
    query = {delivered_offers: self._id.toString(), age: [self.targeting.age_from, self.targeting.age_to], gender: self.targeting.gender, subscribed_pages: [self.page_id]};
    if(self.targeting.mode === 'requests_only') {
      query = {requested_pages: {$in: [self.page_id]}, delivered_offers: self._id.toString()}
    }
  }

  if(self.category === 'birthday_moment') {
    var d = new Date();
    var current_day = d.getDate();
    var current_month = d.getMonth() + 1;
    query = {delivered_offers: self._id.toString(), birth_date: current_day, birth_month: current_month, subscribed_pages: [self.page_id]};
  }

  if(self.category === 'welcome_moment') {
    query = {delivered_offers: self._id.toString(), subscribed_pages: [self.page_id]};
  }
  
  // add to query: delivered_offers: {$nin: [self._id]}
  User.get_enabled(query, {schema: 'owner'}, function(err, result, paging, summary) {
    var output = [];
    _.map(result, function(user) {
      var graphed_user = user.toSchema('default', ['facebook_id', 'onesignal_id', 'devices']);
      output.push({facebook_id: graphed_user.facebook_id, onesignal_id: graphed_user.onesignal_id, devices: graphed_user.devices});
    })
    callback.apply(this, [null, output]);
  });
})

Offer.schema.custom('insights', {acl: 'default', alias: 'counters_live'}, function(query, options, callback){
  var self = this;
  callback = callback || function() {};

  async.parallel({
    delivers: Insight.generate.bind(self, {start_date: '2016-01-01', end_date: '2016-12-31', obj_name: 'offer', obj_id: self._id, event_name: 'delivery', g: 'hour', rt: 'all', merge: 1, internal: 1}),
    views: Insight.generate.bind(self, {start_date: '2016-01-01', end_date: '2016-12-31', obj_name: 'offer', obj_id: self._id, event_name: 'view', g: 'hour', rt: 'all', merge: 1, internal: 1}),
    clicks: Insight.generate.bind(self, {start_date: '2016-01-01', end_date: '2016-12-31', obj_name: 'offer', obj_id: self._id, event_name: 'click', g: 'hour', rt: 'all', merge: 1, internal: 1}),
  }, function(err, counters) {
    if(err) {
      return callback(err);
    }
    self.update_object({counters: counters}, callback.apply(this, [null, counters]))
  });
})

Offer.prototype.deliver_to = function(user_id, with_push, callback) {
  callback = callback || function() {};
  var updates = {$addToSet: {delivered_offers: this._id.toString()}, $pull: {requested_pages: this.page_id}};
  if(with_push) {
    updates['$set'] = {last_push_at: new Date().valueOf()}
  }
  User.update({facebook_id: user_id}, updates).exec(callback);
}

Offer.prototype.attach_to_page = function(callback) {
  callback = callback || function() {};
  var data = {};
      data[this.category] = this._id;
      console.log('{facebook_id: this.page_id}', {facebook_id: this.page_id});
  Page.update({facebook_id: this.page_id}, {$set: {active_moments: data}}, function(err, result) {
    console.log('err', err);
    callback(err, result);
  });
}

Offer.prototype.get_redemption_code = function(query, options, callback) {
  var self = this;
  self.claim_code(callback);
}

// Offer.prototype.page = User.schema.statics.page;
Offer.prototype.insights = Offer.schema.statics.insights;
Offer.prototype.estimated = Offer.schema.statics.estimated;
Offer.prototype.basic = Offer.get.bind(Offer);

module.exports = Offer;