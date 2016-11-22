var _ = require('lodash');
var path = require('path');
var request = require('request');
var myError = require('../myerror');

exports.cleanText = function cleanLinks(text) {
  var urlRegex =/^\s+|\s+$/ig;
  return text.replace(urlRegex, function(url) {
      return '';
  });
}

exports.cleanLinks = function cleanLinks(text) {
  var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return (text || '').replace(urlRegex, function(url) {
      return '';
  });
}

exports.mergedList = function (a1, key1, a2, key2) {
  var query;
      query[key1] = key2;
  return _.map(a1, function(item) {
    return _.extend(item, _.findWhere(a2, query));
  });
}

exports.getField = function (arr, field) {
  return _.map(_.uniq(arr, field), function(item) {
    return _.result(item, field);
  }, []);
}

exports._get = function (path) {
  return function (obj) {
    return _.get(obj, path);
  };
}

exports.isTimestamp = function (ts) {
  return ts.length === 10;
}

exports.isObjectID = function (str) {
  str = str + '';
  var len = str.length, valid = false;
  if (len == 12 || len == 24) {
    valid = /^[0-9a-fA-F]+$/.test(str);
  }
  return valid;
}

exports.validateURL = function (textval) {
  var urlregex = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
  return urlregex.test(textval);
}

exports.grabLinks = function(text, callback) {
  var pattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/ig;
  var mask = new RegExp(pattern);
  text = text ? text : '';
  var urls = text.match(mask) || [];

  if(urls) {
    if(exports.validateURL(exports.setHttp(urls[0]))) {
      request( { method: "HEAD", url: exports.setHttp(urls[0]), followAllRedirects: true, maxRedirects:5, timeout: 10000 }, function (err, response) {
        if(err) {
          return callback(err, response);
        }
        return callback(null, response.request.href);
      });
    } else {
      return callback('Missing valid url');
    }
  } else {
    callback('No URL found');
  }  
}

exports.setHttp = function (link) {
  link = link ? link : '';
  if (link.search(/^http[s]?\:\/\//) === -1) {
      link = 'http://' + link;
  }
  return link;
}

exports.isFunction = function (functionToCheck) {
 var getType = {};
 return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

exports.keys = function(fields) {
  return _.map(fields, function(field) {
    if(field instanceof Object) {
      return field[Object.keys(field)[0]];
    } else {
      return field;
    }
  });
}

exports.clean_json = function(obj) {
  for(var el in obj) {
    if((obj[el] === undefined || obj[el] === null || (obj[el] instanceof Object && !Object.keys(obj[el]).length)) && (typeof(obj[el]) !== 'boolean')) {
      delete obj[el];
    }
  } 
  return obj;
}

exports.format_response = function(err, result, paging, summary) {
  if(err) {
    return {error: err}
  }
  var output = result.length ? exports.clean_json({data: result, paging: paging, summary: summary ? {total_count: summary} : null}): result;
  return Object.keys(exports.clean_json(output)).length ? output : (result instanceof Array ? {data: []} : {error:  myError('No data found.')}); 
}

exports.silent_callback = function() {
  this.constructor.apply(this, [].slice.apply(arguments));
}

exports.title_case = function (string) { 
  return string.charAt(0).toUpperCase() + string.slice(1); 
}

exports.build_module_name = function (filename) {
  return this.title_case(path.basename(filename).replace('.js', ''));
} 