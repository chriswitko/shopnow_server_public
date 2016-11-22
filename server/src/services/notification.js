var _ = require('lodash');
var async = require('async');

var Helper = require('../local_modules/helper');

var User = require('../models').User;
var Offer = require('../models').Offer;
var Notification = require('../models').Notification;

var baseService = require('./base');
_.extend(Notification.prototype, baseService);

module.exports = Notification;