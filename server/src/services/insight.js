var _ = require('lodash');
var async = require('async');

var Helper = require('../local_modules/helper');

var Insight = require('../models').Insight;

var baseService = require('./base');
_.extend(Insight.prototype, baseService);

module.exports = Insight;