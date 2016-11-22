var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Helper = require('../local_modules/helper');

var baseSchema = require('./base');

var modelName = Helper.build_module_name(__filename);
    
var modelSchema = baseSchema.extend({
  user_id: {type: String, required: true, trim: true, index: true},
  offer_id: {type: String, required: true, trim: true, index: true},
  event_name: {type: String, trim: true}, // fetch, deliver, open, click, redeem, claim
  event_value: {type: Date, required: true},
  pings: {type: Number, default: 0},
  created_at: {type: Date},
  updated_at: {type: Date}
});

modelSchema.statics.get_redemption_code = function(user_id, offer_id, callback) {
  callback = callback || function() {};
  this.findOne({user_id: user_id, offer_id: offer_id, event_name: 'claim'}).cache().exec(callback);
}

modelSchema.statics.add_event = function (user_id, offer_id, event_name, event_value, callback) {
  callback = callback || function() {};
  this.update({user_id: user_id, offer_id: offer_id, event_name: event_name}, {$set: {event_value: event_value, updated_at: new Date().valueOf()}, $setOnInsert: {updated_at: new Date().valueOf()}, $inc: {pings: 1}}, {upsert: true}).exec(callback)
};

module.exports = mongoose.model(modelName, modelSchema);;
