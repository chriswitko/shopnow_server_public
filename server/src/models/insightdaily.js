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
  hourly: {},
  minute: {}  
});

var prepare_query = function(time, obj_name, obj_id, event_name, is_unique, callback) {
  var self = this;
  var query = {};
  var update = {};
  var date = moment(time).startOf('day').toISOString();
  var hour = moment(time).format('H'); 
  var minute = moment(time).format('m'); 
  var report_name = is_unique ? 'unique' : 'all';
  var code_daily = moment(time).format('YYMMDD') + '_' + obj_name + '_' + obj_id + '_' + event_name + '_' + report_name;

  callback = callback || function() {};

  query = {
    code: code_daily,
    metadata: {date: new Date(date), obj_name: obj_name, obj_id: obj_id, event_name: event_name, report_name: report_name}
  }

  update['$inc'] = {};
  update['$inc']['hourly.' + hour.toString()] = 1;
  update['$inc']['minute.' + hour.toString() + '.' + minute.toString()] = 1;

  self.update(query, update, {upsert: true}).exec(callback);      
}

modelSchema.statics.track = function(time, obj_name, obj_id, event_name, is_unique, callback) {
  var self = this;
  var tasks = [];

  callback = callback || function() {};

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
  var code_daily = moment(time).format('YYMMDD') + '_' + obj_name + '_' + obj_id + '_' + event_name + '_' + report_name;
  var date = moment(time).startOf('day').toISOString();
  var query;
  
  callback = callback || function() {};

  var hourly = {}
  _.times(24, function(h) {
    hourly[h.toString()] = 0;
  });
  var minute = {}
  _.times(24, function(h) {
    minute[h.toString()] = {};
    _.times(60, function(m) {
      minute[h.toString()][m.toString()] = 0;
    });
  });
  
  var daily_metadata = {date: date, obj_name: obj_name, obj_id: obj_id, event_name: event_name, report_name: report_name}
  
  query = {
    code: code_daily
  }
  
  self.update(query, {$setOnInsert: {metadata: daily_metadata, hourly: hourly, minute: minute}}, {upsert: true}).exec(callback);
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
