#!/usr/bin/env node

var stream_name = process.env.STREAM_NAME || 'standard_offer';

var config = require('../../config/config.js');
var async = require('async');
var moment = require('moment-timezone');
var mongoose = require('mongoose')
require('../../local_modules/cache').install(mongoose, {max:50, maxAge:1000*60*0.5});


console.log('Connecting to DB: ' + config.db);
var options = { server: { socketOptions: { keepAlive: 12000 } } };
mongoose.connect(config.db, options);

var PushServer = require('../../local_modules/pushserver');
  
var Page = require('../../services').Page;
var User = require('../../services').User;
var Offer = require('../../services').Offer;
var InsightDaily = require('../../models').InsightDaily;
var InsightMonthly = require('../../models').InsightMonthly;

console.log('Start at', new Date());

var cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 1);

var stream = Offer.get_offers({}, {stream: true}).stream(); //facebook_id: '146597790193',  maharishi facebook_id: '161936415328', hoodboyz: 141239345919083

if(stream_name === 'requested_only') {
  stream = Offer.get_requested_offers({}, {stream: true}).stream();
} 

if(stream_name === 'birthday_moment') {
  stream = Offer.get_birthday_moments({}, {stream: true}).stream();
} 

if(stream_name === 'welcome_moment') {
  stream = Offer.get_welcome_moments({}, {stream: true}).stream();
} 

var params = {
    app_id: '32eaf9d1-2dff-4f1c-907c-2ae7bd6c4a2e',
    contents: {
        'en': 'You have new offers \ue112',
    },
    ios_badgeType: 'SetTo',
    ios_badgeCount: 1,
    include_player_ids: []
};

stream
.on('data', function (offer) {
  this.pause();
  var self = this;
  var total = 0;
  
  console.log('Processing offer', offer._id, offer.title);
  
  offer.estimated({}, {}, function(err, estimation) {
    console.log('estimation', estimation);
    async.forEach(estimation, function(user, next) {
      console.log('Delivering to', user.facebook_id);
      console.log('OneSignalID', user.onesignal_id);
      async.parallel([
        InsightDaily.log.bind(InsightDaily, new Date(), 'offer', offer._id.toString(), 'delivery', true),
        InsightMonthly.log.bind(InsightMonthly, new Date(), 'offer', offer._id.toString(), 'delivery', true),
        InsightDaily.log.bind(InsightDaily, new Date(), 'page', offer.page_id, 'delivery', true),
        InsightMonthly.log.bind(InsightMonthly, new Date(), 'page', offer.page_id, 'delivery', true)
      ], function() {
        Page.findOne({facebook_id: offer.page_id}, function(err, page) {
          console.log('page', page.name);
          offer.deliver_to(user.facebook_id, user.onesignal_id ? true : false, function(err, result) {
            if(user.onesignal_id && offer.category === 'standard_offer') {
              PushServer.send(user.onesignal_id, {message: 'You have new offer from ' + page.name + ' \ue112', data: {view: 'shopnow.offers'}}, next);
            } else {
              next();
            }
          });
        });
      })
    }, function() {
      self.resume();
    })
  });
})
.on('error', function (err) {
  console.log('Error:', err)
}).on('close', function () {
  console.log('Done:', 'at', new Date());
  process.exit(0)
});

