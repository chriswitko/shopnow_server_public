var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Helper = require('../local_modules/helper');

var baseSchema = require('./base');

var modelName = Helper.build_module_name(__filename);
    
var modelSchema = baseSchema.extend({
  obj_name: {type: String, required: true, trim: true, index: true},
  obj_id: {type: String, required: true, trim: true, index: true},
  url: {type: String, required: true, trim: true}
});

modelSchema.statics.add_like = function (obj_name, obj_id, url, callback) {
  callback = callback || function() {};
  this.update({obj_name: obj_name, obj_id: obj_id}, {$set: {url: url}}, {upsert: true}).exec(callback)
};

module.exports = mongoose.model(modelName, modelSchema);;
