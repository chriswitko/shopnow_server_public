var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Helper = require('../local_modules/helper');

var baseSchema = require('./base');

var modelName = Helper.build_module_name(__filename);
    
var modelSchema = baseSchema.extend({
  user_id: {type: String, required: true, trim: true, index: true},
  page_id: {type: String, required: true, trim: true, index: true},
  created_at: {type: Date, default: Date.now}
});

modelSchema.statics.count_likes = function(user_id, callback) {
  callback = callback || function() {};
  this.count({user_id: user_id}).cache().exec(callback);
}

modelSchema.statics.count_subscribers = function(page_id, callback) {
  callback = callback || function() {};
  this.count({page_id: page_id}).cache().exec(callback);
}

modelSchema.statics.get_subscribers = function(page_id, callback) {
  callback = callback || function() {};
  this.find({page_id: page_id}).cache().exec(callback);
}

modelSchema.statics.add_like = function (user_id, page_id, callback) {
  callback = callback || function() {};
  this.update({user_id: user_id, page_id: page_id}, {$set: {user_id: user_id, page_id: page_id, created_at: new Date().valueOf()}}, {upsert: true}).exec(callback)
};



module.exports = mongoose.model(modelName, modelSchema);;
