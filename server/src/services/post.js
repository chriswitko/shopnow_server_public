var _ = require('lodash');
var async = require('async');

var Helper = require('../local_modules/helper');

var Post = require('../models').Post;

var baseService = require('./base');
_.extend(Post.prototype, baseService);

Post.prototype.basic = Post.get.bind(Post);

module.exports = Post;