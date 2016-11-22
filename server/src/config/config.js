/**
 * Module dependencies.
 */

var path = require('path');
var extend = require('util')._extend;

var development = require('./env/development');
var staging = require('./env/staging');
var production = require('./env/production');


var defaults = {
  root: path.normalize(__dirname + '/..')
};

/**
 * Expose
 */

var env = process.env.NODE_ENV || 'development';

console.info('APP:ENV', env);

module.exports = {
  development: extend(development, defaults),
  staging: extend(staging, defaults),
  production: extend(production, defaults)
}[env];