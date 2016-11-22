"use strict";

var config = require('../config/config.js');
var async = require('async');
var moment = require('moment-timezone');
var _ = require('lodash');
var fb = require('ilkkah-fb');

var Rtu = require('../models/rtu');

// TODO: TEST DEAUTHORIZE // MOVE TO API.js
exports.deauthorize = function(req, res, next) {
  var request = fb.parseSignedRequest(req.body.signed_request, config.facebook.clientSecret);
  var rtu = new Rtu();
  rtu.body = request;
  rtu.save(function() {
    res.json({status: 'success'});
  });
};

exports.getRtu = function(req, res, next) {
  console.log('get /rtu', req.query);
  if (req.query['hub.verify_token'] === config.facebook.secretKey) {
    res.send(req.query['hub.challenge']);
  } else {
    res.json({status: 'error'});
  }
};

// TODO: CREATE PROPER QUEUES
exports.postRtu = function(req, res, next) {
  console.log('post /rtu', req.body);
  var rtu = new Rtu();
  rtu.body = req.body;
  rtu.save(function() {
    res.json({status: 'success'});
  })
};

exports.ping = function(req, res, next) {
  res.json({status: 'success'});
}