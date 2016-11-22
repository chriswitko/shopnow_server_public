var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var moment = require('moment-timezone');
var Schema = mongoose.Schema;

var Helper = require('../local_modules/helper');
var myError = require('../local_modules/myerror');
var paging = require('../local_modules/paging');

var baseSchema = require('./base');
var modelName = Helper.build_module_name(__filename);
    
var modelSchema = baseSchema.extend({
  metadata: {
    date: {type: Date, required: true, index: true},
    code: {type: String, required: true, index: true},
    obj_name: {type: String, required: true, index: true},
    obj_id: {type: String, required: true, index: true},
    event_name: {type: String, required: true, index: true},
    report_name: {type: String, required: true, index: true}
  },
  daily: {}
});

var prepare_query = function(time, obj_name, obj_id, event_name, is_unique, callback) {
  var self = this;
  var query = {};
  var update = {};
  var date = moment(time).startOf('month').toISOString();
  var report_name = 'all';

  callback = callback || function() {};

  var code_monthly = moment(time).format('YYMM') + '_' + obj_name + '_' + obj_id + '_' + event_name + '_' + report_name;
  var day_of_month = moment(time).format('D'); 

  query = {
    code: code_monthly,
    metadata: {date: new Date(date), obj_name: obj_name, obj_id: obj_id, event_name: event_name, report_name: report_name}
  }

  update['$inc'] = {};
  update['$inc']['daily.' + day_of_month.toString()] = 1;

  self.update(query, update, {upsert: true}).exec(callback);
}

modelSchema.statics.track = function(time, obj_name, obj_id, event_name, is_unique, callback) {
  var self = this;
  var tasks = [];

  callback = callback || function() {};
  is_unique = is_unique || false;
  
  tasks.push(prepare_query.bind(self, time, obj_name, obj_id, event_name, false));
  if(is_unique) {
    tasks.push(prepare_query.bind(self, time, obj_name, obj_id, event_name, true));
  }

  async.parallel(
    tasks  
  , function() {
    callback();
  });
};

modelSchema.statics.pre_allocate = function(time, obj_name, obj_id, event_name, report_name, callback) {
  var self = this;
  var code_monthly = moment(time).format('YYMM') + '_' + obj_name + '_' + obj_id + '_' + event_name + '_' + report_name;
  var date;
  var query;
  
  callback = callback || function() {};

  var daily = {}
  _.times(32, function(d) {
    daily[d.toString()] = 0;
  });

  date = moment(time).startOf('month').toISOString();
  var monthly_metadata = {date: date, obj_name: obj_name, obj_id: obj_id, event_name: event_name, report_name: report_name}
  
  query = {
    code: code_monthly
  }
  self.update(query, {$setOnInsert: {metadata: monthly_metadata, daily: daily}}, {upsert: true}).exec(callback); 
};

modelSchema.statics.log = function(time, obj_name, obj_id, event_name, is_unique, callback) {
  var self = this;
  callback = callback || function() {};
  async.series([
    self.pre_allocate.bind(self, time, obj_name, obj_id, event_name, 'unique'),
    self.pre_allocate.bind(self, time, obj_name, obj_id, event_name, 'all'),
    self.track.bind(self, time, obj_name, obj_id, event_name, is_unique)
  ], callback)
}

module.exports = mongoose.model(modelName, modelSchema);;
