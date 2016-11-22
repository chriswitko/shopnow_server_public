"use strict";

var config = require('../../config/config.js');
var request = require('request');
var _ = require('lodash');

exports.get_status = function(vatNumber, cb) {
  request({
    method: 'POST',
    url: 'http://vatmoss.octobat.com/vat.json',
    headers: {
      'Content-Type': 'application/json'
    },
    form: {
      supplier: {
        country: config.vat.country,
        vat_number: config.vat.number //'GB123456789'
      },
      customer: {
        country: vatNumber.substr(0, 2),
        vat_number: vatNumber
      },
      transaction: {
        type: 'B2B',
        eservice: true
      }
    }
  }, function (error, response, body) {
    return cb(error, JSON.parse(body));
  });
}