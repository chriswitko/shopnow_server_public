"use strict";

var config = require('../config/config.js');
var _ = require('lodash');
var async = require('async');
var Helper = require('../local_modules/helper');

// var User = require('../services/user');
// var Post = require('../models/post');
// var Job = require('../models/job');
// var Insight = require('../models/insight');
var Link = require('../services').Link;

var sample_notify = {
    "facebook" : {
        "created_time" : "2015-10-30T12:25:37+0000",
        "type" : "snnotify",
        "link" : "/following/1",
        "message" : "is now available on ShopNow",
        "from" : {
            "likes" : 3892,
            "website" : "http://www.swiezopalona.pl ",
            "username" : "swiezopalona",
            "phone" : "48612504100",
            "link" : "https://www.facebook.com/swiezopalona/",
            "location" : {
                "zip" : "60-111",
                "street" : "Głogowska 273",
                "longitude" : 16.8679999999999986,
                "latitude" : 52.3735008000000022,
                "country" : "Poland",
                "city" : "Poznan"
            },
            "cover" : {
                "id" : "10153303596863378",
                "source" : "https://scontent.xx.fbcdn.net/hphotos-xpf1/v/t1.0-9/s720x720/1795680_10153303596863378_2937815236712400238_n.jpg?oh=154706e60c37647a9d1344643a77e22d&oe=56C4E4F5",
                "offset_y" : 0,
                "offset_x" : 0,
                "cover_id" : "10153303596863378"
            },
            "picture" : {
                "data" : {
                    "url" : "https://scontent.xx.fbcdn.net/hprofile-xlt1/v/t1.0-1/c1.0.50.50/p50x50/11666076_10154030401658378_9083264443773898176_n.jpg?oh=c85e299a2dfd49c81d0e6fd0216f9f42&oe=56F6CBE9",
                    "is_silhouette" : false
                }
            },
            "name" : "Świeżo Palona",
            "category" : "Local Business",
            "id" : "375129063377"
        }
    },
    "url" : "/following/1"
}

exports.test = function(req, res, next) {
  var link = new Link;
  link.get_url({obj_name: req.query.obj_name, obj_id: req.query.obj_id}, function(err, data) {
    res.json({status: 'success', data: data});
  });
  
  // var obj = {
  //   a: {
  //     b: "d",
  //     c: ["e", "f"],
  //     '\u1200': 'unicode key',
  //     'dot.dot': 'key'
  //   }
  // };
  
  // var objectPath = require("object-path");
  
  // console.log(objectPath.get(obj, "a.c"));
  
  // User.create('101533892349092932', {facebook_id: '101533892349092932', nickname:'kwitek', access_token: '123456', birthday: '10/10/1980', location: 'London, United Kingdom', first_name: 'Chris', last_name: 'Witko', picture: 'avatarimage.com/me.jpg', email: 'chris.witko@gmail.com'}, function(err, result) {
  //   if(err) {
  //     return res.json({status: 'error', message: err});
  //   } 
  //   // console.log('subscriptions', result.getSubscriptions());
  //   result.addRole('admin', function() {});

  //   var fields = ['basic', 'subscriptions', 'managed_pages'];
  //   var permissionLevel = 'user_admin';
  //   var all = []; 
    
  //   // result.query({schema: 'user_admin', fields: fields}, function(err, result) {
  //   //   console.log('result', result);
  //   //   res.json(H.formatOutput(err, result));
  //   // })
  //   // {q: 'chris', gender: 'male', age: [35, 36], is_enabled: true}//facebook_id: '101533892349092932',
  //   // User.getAll({q: 'wojtek'}, {schema: permissionLevel, summary: true}, function(err, result, paging, summary) {
  //   //   async.forEachSeries(result, function(user, next) {
  //   //     user = new User(user); 
  //   //     user.query({schema: permissionLevel, fields: fields, summary: true}, function(err, result) {
  //   //       // if('facebook_id' in result) {
  //   //       all.push(result);
  //   //       // }
  //   //       next();
  //   //     })
  //   //   }, function() {
  //   //     res.json(H.formatOutput(null, all, paging, summary));
  //   //   })
  //   // });

  //   User.get({facebook_id: '10153389234909293', schema: permissionLevel}, function(err, user) {
  //     user = new User(user);
  //     user.query({schema: permissionLevel, fields: fields}, function(err, result) {
  //       res.json(H.formatResponse(err, result));
  //     });
  //   });
    
    
  //   // result.query({schema: 'user_admin', fields: fields}, function(err, result) {
  //   //   res.json({status: 'success', data: result});
  //   // });
  // });

  
//   Insight.preAllocate(new Date(), 'page', '1', 'hit', function() {
//     Insight.logEvent(new Date(), 'page', '1', 'hit');
//     res.json({status: 'success'});
//   });
  // Job.addToQueue({name: 'Q_verifyPage', params: {pageID: '376146016948', isVerified: true}, priority: 0}, function(err, queue) {
  //   res.json({status: err, data: queue});
  // });
  // Job.addToQueue({name: 'Q_addNotify', params: sample_notify, priority: 0}, function(err, queue) {
  //   res.json({status: err, data: queue});
  // });
  // Job.addToQueue({name: 'Q_importAllLikesPerUser', params: {userID: '10153389234909293', accessToken: 'CAAHKEdBoY60BAKD6tvZAAnEGx4j4V72neQkPxmg2RgyJnuFcZAJl3VrSGs6C1MprxZBpIW1sZBxO66bripAw64Xz5Bl2bDofZBacvafkUPceDB9h5bIrGy5ZCOfCneN6InqxlNijB09DDRdarz10SwahSq2ImQ63HvbIW2ZAMRPGB4WG7h8FoXNysKb6Fe2mSoZD'}, priority: 0}, function(err, queue) {
  //   res.json({status: err, data: queue});
  // });
  // Job.addToQueue({name: 'Q_importAllPostsPerPage', params: {pageID: '163024737085497', accessToken: '503652836467629|eAc8owgoEUFAlrVPkRuXEX13lJI', quickSnapshot: true}, priority: 0}, function(err, queue) {
  //   res.json({status: err, data: queue});
  // });
  // Job.addToQueue({name: 'Q_importAllLikesPerUser', params: {userID: '10153389234909293', accessToken: 'CAAHKEdBoY60BAKD6tvZAAnEGx4j4V72neQkPxmg2RgyJnuFcZAJl3VrSGs6C1MprxZBpIW1sZBxO66bripAw64Xz5Bl2bDofZBacvafkUPceDB9h5bIrGy5ZCOfCneN6InqxlNijB09DDRdarz10SwahSq2ImQ63HvbIW2ZAMRPGB4WG7h8FoXNysKb6Fe2mSoZD', quickSnapshot: true}, priority: 0}, function(err, queue) {
  //   res.json({status: err, data: queue});
  // });
  // Job.addToQueue({name: 'Q_addPost', params: samplePost, priority: 0}, function(err, queue) {
  //   res.json({status: err, data: queue});
  // });
  // Post.createByFacebook(samplePost, function(err, post) {
  //   if(err) {
  //     return res.json({status: 'error', message: err});
  //   }
  //   return res.json({status: 'success', data: post});
  // })
}
