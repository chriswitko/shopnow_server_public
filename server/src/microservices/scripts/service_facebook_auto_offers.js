#!/usr/bin/env node

var config = require('../../config/config.js');
var async = require('async');
var moment = require('moment-timezone');
var mongoose = require('mongoose')
require('../../local_modules/cache').install(mongoose, {max:50, maxAge:1000*60*0.5});

console.log('Connecting to DB: ' + config.db);
var options = { server: { socketOptions: { keepAlive: 12000 } } };
mongoose.connect(config.db, options);
  
var Page = require('../../services').Page;
var Offer = require('../../services').Offer;

var Facebook = require('../../local_modules/facebook');

var verified = 0, unverified = 0;

console.log('Start at', new Date());

var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);

var stream = Page.verified({$or: [{last_auto_offers_synch_at: {$exists: false}}, {last_auto_offers_synch_at: ''}, {last_auto_offers_synch_at: {$lt: cutoff}}]}, {limit: 1000, stream: true}).stream(); //facebook_id: '146597790193',  maharishi facebook_id: '161936415328', hoodboyz: 141239345919083

stream
.on('data', function (page) {
  this.pause();
  var self = this;
  var total = 0;
  var last_activity = null;
  
  console.log('Processing page', page.facebook_id, page.name);

  var reg_ex = /([$|£|€]\b[-+]?[0-9]\d{0,2}(\.\d{1,2})?[%|$|£|€|]?)|([%|$|£|€]?[-+]?[0-9]\d{0,2}(\.\d{1,2})?\b[%|$|£|€|PLN|USD|GBP|EUR])|\b(wyprzedaż|rabat|procent|discount|percent|sale|promocja|promo|promotion|coupon|kupon|deal|visit|oferta|PLN|USD|GBP|EUR)\b/gi;
  
  Facebook.page({page_id: page.facebook_id}, function(err, page_data) {
    Facebook.posts({pageID: page.facebook_id}, function(err, posts) {//, since: 1453359420
      last_activity = null;
      async.forEach(posts, function(post, cb) {
        var message = post.message;
        if(!last_activity) {
          last_activity = moment(post.created_time).toISOString()
        }
        if(post.type !== 'status' && post.type !== 'video') {
          post.message = post.message || '';
          post.message = post.message.replace(/(?:https?|ftp):\/\/[\n\S]+/g, '');
          if(reg_ex.test(post.message)) {
            total++;
            
            var data = {
              id: post.id,
              post_id: post.id,
              page_id: post.from.id,
              is_auto: true,
              is_enabled: true,
              status: 'paid',
              category: 'standard_offer',
              user_id: 'auto',
              title: post.from.name,
              message: message,
              terms: 'This is offer generated automatically from Facebook post. Terms may apply.',
              redemption_code: '',
              claim_limit: 100,
              link: post.from.website,
              picture: post.full_picture,
              targeting: {mode: 'custom', gender: ['unknown', 'male', 'female'], age_from: 16, age_to: 100},
              timezone: 'Europe/London',
              valid_days: 1, //Math.floor(Math.random() * 3) + 1,
              created_at: moment(post.created_time).toISOString(),
              updated_at: moment(post.created_time).toISOString(),
              deliver_at: new Date().valueOf(),
            }
            
            Offer.create_object({id: data.id, skip: true, data: data}, function(err, result) {
              console.log('err', err);
              cb();
            });          
          } else {
            cb();
          }
        } else {
          cb();
        }
      }, function() {
        if(!last_activity) {
          last_activity = Date().valueOf();
        }
        Page.update({facebook_id: page.facebook_id}, {$set: {is_verified: true, last_auto_offers_synch_at: last_activity}}).exec(function(err, result) {
          self.resume();
        });
      })
    });
  });
})
.on('error', function (err) {
  console.log('Error:', err)
}).on('close', function () {
  console.log('Done:', 'Verified', verified, 'Unverified', unverified, 'at', new Date());
  process.exit(0)
});

