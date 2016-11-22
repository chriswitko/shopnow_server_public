var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Helper = require('../local_modules/helper');
var myError = require('../local_modules/myerror');

var baseSchema = require('./base');
var modelName = Helper.build_module_name(__filename);
​
var modelSchema = baseSchema.extend({
  page_id: {type: String, required: true, trim: true, index: true},
  user_id: {type: String, trim: true, index: true},
  item_name: {type: String, trim: true, required: true},
  quantity: {type: Number, default: 1},
  base_price: {type: Number, default: 0},
  currency_code: {type: String, trim: true},
  tax_country: {type: Number, default: 0},
  payout_foreign_exchange_rate: {type: Number, default: 0},
  total: {type: Number, default: 0}, // add set: {auto-calc}
  request_id: {type: String, trim: true},
  application: {type: String, trim: true, default: 'stripe'},
  action: {type: String, trim: true, enum: ['charge', 'refund'], default: 'charge'},
  status: {type: String, trim: true, enum: ['pending', 'success', 'error'], default: 'pending'},
  country: {type: String, trim: true},
  deliver_at: {type: Date, default: Date.now},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date, default: Date.now},
  is_test: {type: Boolean, default: false}
});

modelSchema.statics.graphql = [];
modelSchema.statics.graphql['payment_default'] = ['item_name', 'base_price', 'currency_code', 'total', 'basic'];
modelSchema.statics.graphql['payment_owner'] = (modelSchema.statics.graphql['offer_default']).concat([{'_id': 'id'}, 'admin_users', 'subscribers', 'admins']);
modelSchema.statics.graphql['payment_admin'] = (modelSchema.statics.graphql['offer_owner']).concat(['category', 'targeting']);

// virtual: redeems_left(max - counter.redeems), business_counters(ctr etc)

// modelSchema.pre('save', function(next) {
//   var self = this;
  
//   next();
// });

modelSchema.statics.find_by_id = function (element_id, callback) {
  callback = callback || function() {};
  if(!element_id || !callback) {
    return callback('Missing element_id or callback');
  }
  this.findOne({ request_id: element_id }).exec(function(err, element) {
    if(err) {
      return callback(err);
    }
    if(!element) {
      return callback(); // 'User does not exists' but it's not error
    }
    callback(null, element);
  });
};

modelSchema.statics.get = function(query, options, callback) {
  callback = callback || function() {};
  _.extend(options, {one: true});
  return this.search.apply(this, [{request_id: options.request_id}, options, callback]);
};

modelSchema.statics.get_all = function(query, options, callback) {
  callback = callback || function() {};
  return this.clean_json(this.search.apply(this, [query, options, callback]));
};

module.exports = mongoose.model(modelName, modelSchema);
