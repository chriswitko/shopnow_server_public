var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Helper = require('../local_modules/helper');

var baseSchema = require('./base');

var modelName = Helper.build_module_name(__filename);
    
var modelSchema = baseSchema.extend({
  user_id: {type: String, required: true, trim: true, index: true},
  source_name: {type: String, required: true, trim: true, index: true},
  source_id: {type: String, required: true, trim: true, index: true},
  status: {type: String, trim: true, default: 'pending', enum: ['pending', 'sent', 'error']},
  delivery_id: {type: String, trim: true},
  delivery_address: {type: String, trim: true},
  delivery_method: {type: String, trim: true, default: 'push_ios', enum: ['ios', 'android', 'email', 'status', 'silent']},
  sent_at: {type: Date},
  payload: {}
});

modelSchema.statics.can_send_to = function(user_id, source_name, source_id, callback) {
  callback = callback || function() {};
  this.count({user_id: user_id}).cache().exec(callback);
}

module.exports = mongoose.model(modelName, modelSchema);;
