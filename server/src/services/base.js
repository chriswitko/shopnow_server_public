var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var extend = require('mongoose-schema-extend');
var Schema = mongoose.Schema;

var myError = require('../local_modules/myerror');

var modelSchema = require('../models/base');

var Base = modelSchema.extend({});

Base.format_response = function(err, result, paging, summary) {
  var self = this;
  if(err) {
    return {error: err}
  }
  var output = result.length ? self.constructor.clean_json({data: result, paging: paging, summary: summary ? {total_count: summary} : null}): result;
  return Object.keys(self.constructor.clean_json(output)).length ? output : (result instanceof Array ? {data: []} : {error:  myError('No data found.')}); 
}

Base.query = function(query, options, callback) {
  var self = this;
  var stack = {};

  callback = callback || function() {};
  _.extend(options, {facebook_id: self.facebook_id});

  options.fields = _.compact(options.fields).length ? options.fields : self.schema.statics.get_fields.call(self, 'default');
  
  async.forEachSeries(options.fields, function(field, next) {
    if(field in self) {
      if(self[field] instanceof Function) {
        self[field].apply(self, [query, options, function(err, result) {
          if(!err) {
            stack[field] = result instanceof Array ? self.format_response(err, result) : result;
            next();
          } else {
            return callback(err, stack instanceof Array ? self.format_response(err, stack) : stack);
          }
        }])
      } else {
        if(self.toJSON()[field] || typeof(self.toJSON()[field]) === 'boolean') {
          stack[field] = self.toJSON()[field] instanceof Array ? self.format_response(null, self.toJSON()[field]) : self.toJSON()[field];
          next();
        } else if(self.schema.statics[field]) {
          if(self.schema.statics[field]) {
            self.schema.statics[field].call(self, function(err, result) {
              stack[field] = result;
              next();
            })
          }
        } else {
          next();
        }
      }
    } else {
      next();
    }
  }, function(err) {
    callback(err, self.constructor.toSchema(stack, options.schema));
  });
}


module.exports = Base;