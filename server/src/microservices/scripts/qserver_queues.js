var config = require('../../config/config.js');
var async = require('async');
var kue = require('kue');
var queue = kue.createQueue();
var moment = require('moment-timezone');
var mongoose = require('mongoose')
require('../../local_modules/cache').install(mongoose, {max:50, maxAge:1000*60*0.5});

console.log('Connecting to DB: ' + config.db);
var options = { server: { socketOptions: { keepAlive: 12000 } } };
mongoose.connect(config.db, options);

var PushServer = require('../../local_modules/pushserver');

var User = require('../../services').User;
var Page = require('../../services').Page;
var Offer = require('../../services').Offer;
var InsightDaily = require('../../models').InsightDaily;
var InsightMonthly = require('../../models').InsightMonthly;

var Facebook = require('../../local_modules/facebook');

var verified = 0, unverified = 0;

queue.process('send_campaign', function(job, done){
  process_offer(new Offer(job.data.offer), done);
});

queue.process('refresh_offers', function(job, done){
  process_page(new Page(job.data.page), done);
});

queue.process('register_user', function(job, done){
  process_user(new User(job.data.user), done);
});

console.log('Start at', new Date());

var params = {
    app_id: '32eaf9d1-2dff-4f1c-907c-2ae7bd6c4a2e',
    contents: {
        'en': 'You have new offers \ue112',
    },
    ios_badgeType: 'SetTo',
    ios_badgeCount: 1,
    include_player_ids: []
};

function process_page(page, done) {
  var self = this;
  var total = 0;
	var last_activity = null;
  
  console.log('Processing page', page.facebook_id, page.name);

  var reg_ex = /([$|£|€]\b[-+]?[0-9]\d{0,2}(\.\d{1,2})?[%|$|£|€|]?)|([%|$|£|€]?[-+]?[0-9]\d{0,2}(\.\d{1,2})?\b[%|$|£|€|PLN|USD|GBP|EUR])|\b(wyprzedaż|rabat|procent|discount|percent|sale|promocja|promo|promotion|coupon|kupon|deal|visit|oferta|PLN|USD|GBP|EUR)\b/gi;
  
  Facebook.page({page_id: page.facebook_id}, function(err, page_data) {
		Facebook.posts({pageID: page.facebook_id}, function(err, posts) {//, since: 1453359420
			console.log('total posts', posts.length);
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
				console.log('processing done');
				// if(total) {
				if(!last_activity) {
					last_activity = Date().valueOf();
				}
				Page.update({facebook_id: page.facebook_id}, {$set: {is_verified: true, last_auto_offers_synch_at: last_activity}}).exec(function(err, result) {
					done();
				});
				// } else {
					// done();
				// }
			})
		});
  });
}

function process_offer(offer, done) {
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
      done();
    })
  });
}

function process_user(user, done) {
  var self = this;
  
  console.log('Processing user', user.facebook_id, user.first_name, user.last_name);
  
  var loop = user.is_ready ? false : true;
    
  var tasks = [];
  if(user.email !== user.facebook_id && user.access_token) {
    tasks.push(user.import_likes.bind(user, {loop: loop, max: 50, skip: true}));
  }
  
  tasks.push(user.mark_ready.bind(user));
  tasks.push(user.mark_synched.bind(user))  
    
  async.series(tasks, function(err, result) {
    if(err) {
      console.log('ERR', err);
      if(!user.access_token) {
        user.update({$set: {has_errors: false, is_ready: true, is_synched: true}}, function() {
          self.resume();
        })        
      } else {
        user.mark_has_errors(function() {
          done();
        });
      }
    } else {
      verified += result[0].verified;
      unverified += result[0].unverified;
      user.mark_has_no_errors(function() {
        console.log('done', user.facebook_id);
        done();
      });
    }
  })
}