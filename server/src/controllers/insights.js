"use strict";

var config = require('../config/config.js');
var async = require('async');
var moment = require('moment-timezone');require('moment-round');

var Insight = require('../services').Insight;

exports._log = function(options, callback) {
  Insight._log(options, callback);  
}

exports.log = function(req, res, next) {
  var now =  new Date();
  var next15min = moment().floor(15, 'minutes');
  var objName = req.body.n || req.query.n;
  var objId = req.body.i || req.query.i;
  var eventName = req.body.e || req.query.e;

  if(!objName || !objId || !objId) {
    return res.json({status: 'error', message: 'Missing params'});
  }

  Insight._log({time: now, obj_name: objName, obj_id: objId, event_name: eventName, report_name: 'all', user_id: req.signed.id});
  // exports._log({time: next15min, objName: objName, objId: objId, eventName: eventName, reportName: 'unique'});

  res.json({status: 'success', data: next15min});
}

// localhost:3000/api/insights?n=ad&i=Ekm2bbXbg&e=open&access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEwMTUzMzg5MjM0OTA5MjkzIiwiaWF0IjoxNDQ1NDE3MzQ4fQ.5HXp2ERkfAJrs1-ifAvnOF_Yg93byGpfiDewcvY8wQE
// http://localhost:3000/api/insights/user?start=2015-11-09&end=2015-12-18&ts=1&id=1&event=login&g=hour&rt=unique&access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEwMTUzMzg5MjM0OTA5MjkzIiwiaWF0IjoxNDQ3MDcwNTU4fQ.Kapu-vmkAt_zhlmV_V9IkLmaWsF6EPZK8cyG8HgNrBE
// http://localhost:3000/api/insights/user?start=2015-11-09&end=2015-12-18&ts=1&id=1&event=login,appopens&g=hour&rt=unique,all&access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEwMTUzMzg5MjM0OTA5MjkzIiwiaWF0IjoxNDQ3MDcwNTU4fQ.Kapu-vmkAt_zhlmV_V9IkLmaWsF6EPZK8cyG8HgNrBE
// http://localhost:3000/api/insights/user?start=2015-11-09&end=2015-12-18&ts=1&id=1&event=login,appopens&g=hour&rt=unique,all&access_token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEwMTUzMzg5MjM0OTA5MjkzIiwiaWF0IjoxNDQ3MDcwNTU4fQ.Kapu-vmkAt_zhlmV_V9IkLmaWsF6EPZK8cyG8HgNrBE
exports.report = function(req, res, next) {
  Insight.generate({start_date: req.query.start, end_date: req.query.end, obj_name: req.params.objName, obj_id: req.query.id, event_name: req.query.event, g: req.query.g, rt: req.query.rt, merge: req.query.ts}, function(err, result) {
    res.json(result);    
  });
}

exports.upload = function(req, res, next) {
  var data = req.body.insights || [];

  async.forEach(data, function(item, cb) {
    Insight.preAllocate(item.d, item.n, item.i, item.e, function() {
      Insight.logEvent(item.d, item.n, item.i, item.e);
      cb();
    });
  }, function() {
    res.json({status: 'success'});
  })
}

exports.exchange = function(options, callback) {
  var stats = options.stats || {};

  async.forEach(stats.stats, function(stat, cb) {
    exports._log(stat, function() {
      cb();
    });
  }, function(err) {
    callback(err, {'lastSynchAt': new Date()});
  })
}