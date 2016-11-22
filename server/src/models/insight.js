// Based on: https://docs.mongodb.org/ecosystem/use-cases/pre-aggregated-reports/

var mongoose = require('mongoose');

var moment = require('moment-timezone');
var _ = require('lodash');
var async = require('async');

var insightDailySchema = mongoose.Schema({
  metadata: {
    date: {type: Date, index: true},
    code: {type: String, index: true},
    obj_name: {type: String, index: true},
    obj_id: {type: String, index: true},
    event_name: {type: String, index: true},
    report_name: {type: String, index: true}
  },
  hourly: {},
  minute: {}
});

var insightMonthlySchema = mongoose.Schema({
  metadata: {
    date: {type: Date, index: true},
    code: {type: String, index: true},
    obj_name: {type: String, index: true},
    obj_id: {type: String, index: true},
    event_name: {type: String, index: true},
    report_name: {type: String, index: true}
  },
  daily: {}
});

var InsightDaily = mongoose.model('InsightDaily', insightDailySchema);
var InsightMonthly = mongoose.model('InsightMonthly', insightMonthlySchema);

exports.InsightDaily = InsightDaily;
exports.InsightMonthly = InsightMonthly;

exports.log_event = function(time, obj_name, obj_id, event_name, report_name, userID, is_unique, callback) {
  var query = {};
  var update = {};
  var date;
  var method = report_name === 'unique' ? '$set' : '$inc';

  is_unique = is_unique || false;

  async.waterfall([
    function(done) {
      // update daily stats
      var code_daily = moment(time).format('YYMMDD') + '_' + obj_name + '_' + obj_id + '_' + event_name + '_' + report_name;
      var hour = moment(time).format('H'); 
      var minute = moment(time).format('m'); 
      date = moment(time).startOf('day').toISOString();
    
      query = {
        code: code_daily,
        metadata: {date: new Date(date), obj_name: obj_name, obj_id: obj_id, event_name: event_name, report_name: report_name}
      }
    
      update[method] = {};
      update[method]['hourly.' + hour.toString()] = 1;
      update[method]['minute.' + hour.toString() + '.' + minute.toString()] = 1;
    
      InsightDaily.update(query, update, {upsert: true}).exec(function() {});      
      // if(is_unique) {
        query.metadata.report_name = 'unique';
        InsightDaily.update(query, update, {upsert: true}).exec(function() {});      
      // }         
      done();
    },
    function(done) {
      // update monthly stats
      var code_monthly = moment(time).format('YYMM') + '_' + obj_name + '_' + obj_id + '_' + event_name + '_' + report_name;
      var day_of_month = moment(time).format('D'); 
      date = moment(time).startOf('month').toISOString();
    
      query = {
        code: code_monthly,
        metadata: {date: new Date(date), obj_name: obj_name, obj_id: obj_id, event_name: event_name, report_name: report_name}
      }
    
      update[method] = {};
      update[method]['daily.' + day_of_month.toString()] = 1;
    
      InsightMonthly.update(query, update, {upsert: true}).exec(function() {});
      if(is_unique) {
        query.metadata.report_name = 'unique';
        InsightMonthly.update(query, update, {upsert: true}).exec(function() {});
      }          
      done();
    }
  ], function() {
    return;
  });
};

exports.preAllocate = function(time, obj_name, obj_id, event_name, report_name, callback) {
  var code_daily = moment(time).format('YYMMDD') + '_' + obj_name + '_' + obj_id + '_' + event_name + '_' + report_name;
  var code_monthly = moment(time).format('YYMM') + '_' + obj_name + '_' + obj_id + '_' + event_name + '_' + report_name;
  var date;
  var query;

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
  var daily = {}
  _.times(32, function(d) {
    daily[d.toString()] = 0;
  });

  date = moment(time).startOf('day').toISOString();
  var daily_metadata = {date: date, obj_name: obj_name, obj_id: obj_id, event_name: event_name, report_name: report_name}
  
  query = {
    code: code_daily
  }
  
  InsightDaily.update(query, {$setOnInsert: {metadata: daily_metadata, hourly: hourly, minute: minute}}, {upsert: true}).exec(function(err) {
    date = moment(time).startOf('month').toISOString();
    var monthly_metadata = {date: date, obj_name: obj_name, obj_id: obj_id, event_name: event_name, report_name: report_name}
    
    query = {
      code: code_monthly
    }
    InsightMonthly.update(query, {$setOnInsert: {metadata: monthly_metadata, daily: daily}}, {upsert: true}).exec(function(err) {
      callback(); 
    }); 
  });
};

exports._log = function(options, callback) {
  options.time = options.time ? options.time : new Date();
  exports.preAllocate(options.time, options.obj_name, options.obj_id, options.event_name, 'unique', function() {
    exports.preAllocate(options.time, options.obj_name, options.obj_id, options.event_name, options.report_name, function() {
      exports.log_event(options.time, options.obj_name, options.obj_id, options.event_name, options.report_name, options.user_id, options.is_unique, callback);
    });
  });  
}

var _report = function(options, callback) {
  // Retrieving Data for a Real-Time Chart  
  var report_name = options.report_name ? options.report_name : 'all';
  var granularity = options.granularity ? options.granularity : 'minute';
  var start_date = new Date(options.start_date ? moment(options.start_date).startOf('day').toISOString() : moment().startOf('day').toISOString());
  var end_date = new Date(moment(options.end_date ? options.end_date : options.start_date).startOf('day').toISOString());
  var obj_name = options.obj_name;
  var obj_id = options.obj_id;
  var event_name = options.event_name;
  var query;
  var fields = {};

  if(granularity === 'minute') {
    query = {'metadata.date': { '$gte': start_date, '$lte': end_date }, 'metadata.obj_name': obj_name, 'metadata.obj_id': obj_id, 'metadata.event_name': event_name, 'metadata.report_name': report_name}
    fields = { 'minute': 1 }
  }

  if(granularity === 'hour') {
    query = {'metadata.date': { '$gte': start_date, '$lte': end_date }, 'metadata.obj_name': obj_name, 'metadata.obj_id': obj_id, 'metadata.event_name': event_name, 'metadata.report_name': report_name}
    fields = { 'hourly': 1 }
  }

  if(granularity === 'month') {
    start_date = new Date(options.start_date ? moment(options.start_date).startOf('month').toISOString() : moment().startOf('month').toISOString());
    end_date = new Date(moment(options.end_date ? options.end_date : options.start_date).startOf('month').toISOString());
    query = {'metadata.date': { '$gte': start_date, '$lte': end_date }, 'metadata.obj_name': obj_name, 'metadata.obj_id': obj_id, 'metadata.event_name': event_name, 'metadata.report_name': report_name}
    fields = { 'daily': 1 }
  }

  fields['metadata.date'] = 1;
  fields['_id'] = 0;

  if(granularity === 'minute' || granularity === 'hour') {
    return InsightDaily.find(query, fields).sort({'metadata.date': 1});
  }

  if(granularity === 'month' || granularity === 'daily') {
    return InsightMonthly.find(query, fields).sort({'metadata.date': 1});
  }

  // To retrieve daily data for a single month, use the following query:
  // db.stats.monthly.find_one({'metadata': {'date':dt, 'site': 'site-1', 'page':'/index.html'}}, { 'daily': 1 })

  // To retrieve several months of daily data, use a variation on the above query:
  // db.stats.monthly.find({'metadata.date': { '$gte': dt1, '$lte': dt2 }, 'metadata.site': 'site-1', 'metadata.page': '/index.html'}, { 'metadata.date': 1, 'daily': 1 } }, sort=[('metadata.date', 1)])  
}

exports.report = function(options, callback) {
  var summarize = 'hourly';
  var granularity = options.g || 'minute';
  var report_name = options.rt || 'all';
  var merge = options.merge;
  var sum = {};

  if(granularity === 'hour') {
    summarize = 'hourly';
  } else if(granularity === 'minute') {
    summarize = 'minute';
  } else if(granularity === 'month') {
    summarize = 'daily';
  }

  _report({start_date: options.start_date, end_date: options.end_date, obj_name: options.obj_name, obj_id: options.obj_id, event_name: options.event_name, granularity: options.g, report_name: report_name, merge: options.merge}).then(function(result) {
    for(var item in result) {
      var tmp = result[item].toObject();
      var s = _.reduce(result[item][summarize], function(s, entry) {
        return s + parseFloat(entry);
      }, 0);
      if(s) {
        tmp.total = s;
        if(merge) {
          if(!sum[options.event_name + '_' + report_name]) {
            sum[options.event_name + '_' + report_name] = 0;
          }
          sum[options.event_name + '_' + report_name] += tmp.total;
        }
      }
      result[item] = tmp;
    }
    if(merge) {
      return callback(null, {data: result, summarize: sum[options.event_name + '_' + report_name] || 0});
    } 
    return callback(null, {data: result});
  });
}

exports.generate = function(options, callback) {
  var events = options.event_name.split(',');
  var report_names = options.rt.split(',');
  var output = {};

  async.forEach(events, function(event, cb1) {
    async.forEach(report_names, function(report_name, cb2) {
      output[event] = {};
      exports.report({start_date: options.start_date, end_date: options.end_date, obj_name: options.obj_name, obj_id: options.obj_id, event_name: event, g: options.g, rt: report_name, merge: options.merge}, function(err, result) {
        output[event][report_name] = result;
        cb2();
      });
    }, function() {
      cb1();
    });
  }, function() {
    if(options.internal) {
      if(events[0] && report_names[0] && output) {
        callback(null, output[events[0]][report_names[0]].summarize);
      } else {
        callback(null, 0);
      }
    } else {
      callback(null, output);    
    }
  });
}