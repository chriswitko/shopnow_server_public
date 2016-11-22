"use strict";

var async = require('async');
var _ = require('lodash');
var jwt    = require('jsonwebtoken');
var kue = require('kue');
var queue = kue.createQueue();

var Model = require('../services').Offer;

var Helper = require('../local_modules/helper');
var paging = require('../local_modules/paging');

exports.test_create = function(req, res, next) {
  var data = {
    id: '',
    page_id: '220802644708945',
    user_id: '10153389234909293',
    title: 'Test Offer',
    message: 'Nothing to add',
    terms: 'Only once',
    redemption_code: 'SHOPNOW10',
    claim_limit: 100,
    link: 'http://shopnowapp.com',
    picture: 'https://pbs.twimg.com/media/CYnHXteWYAE5vAJ.png:large',
    targeting: {gender: ['unknown', 'male'], age_from: 16, age_to: 100},
    timezone: 'Europe/London',
    valid_days: 1,
    deliver_at: new Date().valueOf(),
  }
  
  // Offer.create_object({data: data}, function(err, result) {
  //   res.json({err: err, data: result});
  // });
  Model.get({id: '5696723328287070723f4fb6'}, {schema: 'offer_default'}, function(err, offer) {
    offer.get_estimate_target({age_from: offer.targeting.age_from, age_to: offer.targeting.age_to, subscribed_pages: [offer.page_id]}, function(err, result) {
      res.json({data: result});
    });
  });
}

exports.create = function(req, res, next) {
  async.waterfall([
    function(done) {
      Model.create_object({id: req.body._id || null, skip: false, data: req.body}, done);      
    },
    function(offer, done) {
      console.log('offer', offer);
      if(offer.category === 'welcome_moment' || offer.category === 'birthday_moment') {
        offer.attach_to_page(function() {
          done(null, offer);
        })
      } else {
        done(null, offer);
      }
    },
    function(offer, done) {
      var job = queue.create('send_campaign', {
          offer: offer
      }).save( function(err){
        if( !err ) console.log( job.id );
        done(null, offer);
      });
    }
  ], function() {
    res.json({status: 'success'});
  });
}

exports.delete = function(req, res, next) {
  Model.find_by_id(req.params.offer_id, function(err, offer) {
    if(err || !offer) {
      return res.json({status: 'error', message: err});
    }
    offer.disable(function() {
      console.log('err', err);
      res.json({status: 'success'});
    });
  });     
}

exports.get_all = function(req, res, next) {
  var header = parse_query(req);

  async.waterfall([
    function(done) {
      Model.get_dataset(req.params.dataset || 'get_all', header.query, {schema: header.options.schema, summary: header.options.summary, limit: header.options.limit, after: header.options.after, sort: header.options.sort}, done);
    },
    function(result, paging, summary, done) {
      Model.format_object(result, header, paging, summary, done);
    }
  ], function(err, result, paging, summary) {
    res.json(Helper.format_response(err, {data: result, paging: paging, summary: summary}));    
  })
}

exports.claim = function(req, res, next) {
  Model.get({_id: get_offer_id(req)}, {schema: req.signed.schema_type}, function(err, offer) {
    offer.claim_code(function(err, result) {
      res.json(Helper.format_response(err, result));
    })
  });
}

exports.update = function(req, res, next) {
  if(!req.query.key) {
    return res.json(Helper.format_response('Missing key parameter'));
  }
  Model.get({_id: get_offer_id(req), schema: req.signed.schema_type}, function(err, offer) {
    var data = {};
        data[req.query.key] = req.query.value;
    Model(offer).update_object(data, function(err, result) {
      res.json(Helper.format_response(err, {status: 'success', data: result}));
    })
  });
}

exports.tag_offer = function(req, res, next) {
  Model.find_by_id(get_offer_id(req), function(err, offer) {
    offer.update({$set: {badge: req.body.badge, badge_color: req.body.badge_color}}, function(err, result) {
      res.json({status: 'success', data: result});
    })
  });
}

exports.count_all = function(req, res, next) {
  Model.count_all(function(err, result) {
    res.json({total: result});
  })
}

exports.me = function(req, res, next) {
  var header = parse_query(req);
  _.extend(header.options, {_id: get_offer_id(req)});
  
  async.waterfall([
    function(done) {
      Model.find_by_id(get_offer_id(req), function(err, offer) {
        done(err, offer);
      })
    },
    function(offer, done) {
      if(offer) {
        offer.query(header.query, header.options, function(err, result) {
          done(err, result);
        })
      } else {
        done(null, {});
      }
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, Helper.clean_json(result)));
  })
}

/*
  SUPPORT METHODS
*/

var get_user_id = function(req) {
  return req.query.user_id || req.signed.id;
}

var get_offer_id = function(req) {
  return req.params.offer_id;
}

var parse_query = function(req) {
  var fields = (req.params.field || req.query.fields || '').trim();
  var options = {
    fields: fields.length ? fields.split(',') : '', 
    schema: req.signed.schema_type,
    summary: req.query.summary,
    limit: req.query.limit,
    after: req.query.after,
    sort: req.query.sort, 
    user_id: req.query.user_id || req.signed.id,
    page_id: req.query.page_id 
  }
  var query = {
    q: req.query.q,
    age: req.query.age,
    gender: req.query.gender
  }
  return {
    options: options,
    query: query
  }  
}
