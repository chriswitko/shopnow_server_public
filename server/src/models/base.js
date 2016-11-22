var _ = require('lodash');
var async = require('async');
var objectPath = require("object-path");

var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');
var random = require('mongoose-simple-random');
var extend = require('mongoose-schema-extend');
var Schema = mongoose.Schema;

var config = require('../config/config.js');
var myError = require('../local_modules/myerror');
var paging = require('../local_modules/paging');

var Helper = require('../local_modules/helper');
    
var modelSchema = new Schema();

modelSchema.statics.get_fields = function(acl) {
  var all = this.schema.tree;
  acl = acl || 'default';
  _.extend(all, this.schema.statics);
  return _.filter(_.map(all, function(val, key) {
    val.acl = val.acl ? val.acl instanceof Array ? val.acl : val.acl.split(',') : [];
    if(acl === 'admin') {
      return key;
    } else if(acl === 'owner' && val.acl && (val.acl.indexOf('owner') > -1 || val.acl.indexOf('default') > -1) && val.acl.indexOf('admin') < 0) {
      return key;
    } else if(acl === 'default' && val.acl && val.acl.indexOf('default') > -1 && val.acl.indexOf('admin') < 0 && val.acl.indexOf('owner') < 0) {
      return key;
    }
  }), function(field) {return field !== undefined});
}

modelSchema.statics.get_fields_schema = function() {
  var all = this.schema.tree;
  var output = [];
  _.extend(all, this.schema.statics);
  _.map(all, function(val, key) {
    return output[key] = val.alias || key;
  });
  return output;
}

modelSchema.statics.get_dataset = function(dataset_name, query, options, callback) {
  if(dataset_name in this.schema.statics) {
    return this.schema.statics[dataset_name].apply(this, [query, options, callback]);
  } else {
    return callback(myError('Filter does not exists.'));
  }
};

modelSchema.statics.format_object = function(result, header, paging, summary, callback) {
  var self = this;
  var output = [];
  async.forEachSeries(result, function(element, next) {
    var options = {schema: header.options.schema, fields: header.options.fields, summary: header.options.summary};
    if(self.schema.statics.internalModelName && self.schema.statics.internalModelName() === 'User') {
      _.extend(options, {user: element});
    }
    element.query({}, options, function(err, result) {
      output.push(result);
      next();
    })
  }, function() {
    callback(null, output, paging, summary);
  })
}

modelSchema.statics.create_object = function (options, callback) {
  var Self = this;
  callback = callback || function() {};
  this.find_by_id(options.id, function(err, element) {
    if(err) {
      return callback(err, element);
    } 
    
    var now = new Date();
    options.data.updated_at = now.valueOf();
    if(element !== undefined && options.skip) {
      return callback.apply(this, [null, element]); 
    } else if(element !== undefined) {
      _.extend(element, options.data)
    } else {
      element = new Self();
      _.extend(element, options.data)
    }
    
    element.save(function(err) {
      element.isNew = true;
      return callback.apply(this, [err, element]); 
    });      
  })
};

modelSchema.methods.update_object = function(data, callback) {
  callback = callback || function() {};
  this.update({$set: data}, { runValidators: true }, callback);
}

modelSchema.statics.clean_json = function(obj) {
  for(var el in obj) {
    if(obj[el] === undefined || obj[el] === null || (obj[el] instanceof Object && !Object.keys(obj[el]).length)) {
      delete obj[el];
    }
  } 
  return obj;
}

modelSchema.statics.build_query = function(params) {
  var self = this;
  var query = {};
  var keys = [];
  
  params = self.clean_json(params) || {};
  
  _.each(self.schema.tree, function(field, key) {
    keys.push(key);
  });
  
  keys.forEach(function(key) {
    if(params.hasOwnProperty(key)) {
      query[key] = params[key];
    }
  });

  if(params.hasOwnProperty('delivered_offers') && params.delivered_offers) {
    query['delivered_offers'] = {$nin: [params.delivered_offers]};
  }  
    
  if(params.hasOwnProperty('page_ids') && params.page_ids) {
    query['facebook_id'] = {$in: params.page_ids.split(',')} 
  }  
  
  if(params.hasOwnProperty('page_id') && params.page_id) {
    if(params.page_id instanceof Array) {
      query['page_id'] = {$in: params.page_id}
    } else {
      query['page_id'] = {$in: params.page_id.split(',')}
    } 
  }    

  if(params.hasOwnProperty('not_page_id') && params.not_page_id) {
    if(params.not_page_id instanceof Array) {
      query['page_id'] = {$nin: params.not_page_id}
    } else {
      query['page_id'] = {$nin: params.not_page_id.split(',')}
    } 
  }    
  
  if(params.hasOwnProperty('birth_date') && params.birth_date) {
    query['birth_date'] = params.birth_date;
  }

  if(params.hasOwnProperty('birth_month') && params.birth_month) {
    query['birth_month'] = params.birth_month;
  }

  if(params.hasOwnProperty('age') && params.age) {
    if(params.age instanceof Array) {
      query['age'] = {$gte: params.age[0], $lte: params.age[1]};
    } else {
      query['age'] = {$gte: params.age, $lte: params.age};
    }
  }

  if(params.hasOwnProperty('gender') && params.gender) {
    if(params.gender instanceof Array) {
      query['gender'] = {$in: params.gender};
    } else {
      query['gender'] = {$in: [params.gender, 'unknown']}
    }
  }

  if(params.hasOwnProperty('targeting.age') && params['targeting.age']) {
    if(params['targeting.age'] instanceof Array) {
      query['targeting.age_from'] = {$lte: params['targeting.age'][0]};
      query['targeting.age_to'] = {$gte: params['targeting.age'][1]};
    } else {
      query['targeting.age_from'] = {$lte: params['targeting.age']};
      query['targeting.age_to'] = {$gte: params['targeting.age']};
    }
  }
    
  if(params.hasOwnProperty('targeting.gender') && params['targeting.gender']) {
    query['targeting.gender'] = {$in: [params['targeting.gender'], 'unknown']}
  }  

  if(params.hasOwnProperty('targeting.mode') && params['targeting.mode']) {
    query['targeting.mode'] = params['targeting.mode'];
    if(params['targeting.user_ids'] && params['targeting.user_ids'].length) {
      query['targeting.user_ids'] = {$in: [params['targeting.user_ids']]}
    }
  }  
  
  // if(params.hasOwnProperty('targeting.user_ids') && params['targeting.user_ids']) {
  //   query['targeting.user_ids'] = {$in: [params['targeting.user_ids']]}
  // }  
  
  if(params.hasOwnProperty('subscribed_pages') ) { //&& params.subscribed_pages
    query['subscribed_pages'] = {$in: params.subscribed_pages}
  }  
    
  // if(params.hasOwnProperty('q') && params.q) {
  //   var fulltextFields = [];
  //   query['$or'] = [];
  //   _.each(self.schema.tree, function(field, key) {
  //     if(field.fulltext) {
  //       fulltextFields.push(key);
  //     }
  //   });
  //   fulltextFields.forEach(function(key) {
  //     var attr = {};
  //     attr[key] = new RegExp(params.q, 'i');
  //     query['$or'].push(attr);
  //   });
  //   if(!query['$or'].length) {
  //     delete query['$or'];
  //   }
  // }
  
  if(params.hasOwnProperty('q') && params.q) {
    var fulltextFields = [];
    var attr = {};
    query['$or'] = [];
    if(self.schema.tree.tags) {
      attr['tags'] = {$in: _.filter(params.q.replace(/,/g, ' ').split(' '), function(word) {return word.replace(/ /g, '').length})};
      query['$or'].push(attr);
    }
    
    _.each(self.schema.tree, function(field, key) {
      if(field.fulltext) {
        fulltextFields.push(key);
      }
    });
    
    fulltextFields.forEach(function(key) {
      attr = {};
      var words = params.q.split(' ');
      var sentence = '';
      words.forEach(function(word) {
        sentence += '(?=.*' + word + ')';
      });
      attr[key] = new RegExp(sentence, 'i');
      // attr[key] = new RegExp('(' + params.q.replace(/ /g, '|') + ')', 'i');
      query['$or'].push(attr);
    });
    if(!query['$or'].length) {
      delete query['$or'];
    }
  }  
  console.log('query-me', query);
  
  return query;
};


modelSchema.statics.search = function(query, options, callback) {
  // console.log('hello search');

  var self = this;
  var timeout = 5;
  
  options = options || {};
  callback = callback || function() {};
  
  if('timeout' in options) {
    timeout = options.timeout;
  }
  
  if(!options.stream) {
    query = self.build_query(query);
  }
  
  // console.log('query', query);
  var sort_helper = {};
  
  if(options.hasOwnProperty('sort')) {
    sort_helper[options.sort] = options.sort_order || -1;
  }
  
  options.sort = options.sort ? sort_helper : {'updated_at': -1};
  options.limit = options.limit ? parseInt(options.limit) : 10;
  options.current_page = options.after || 1;
  options.after = options.after ? (options.after - 1) * options.limit : 0;

  if(options.stream) {
    return self.find(query, {}, options);    
  }
  
  if(options.raw) {
    if(timeout === -1) {
      self.find(query, {}).skip(options.after).limit(options.limit).sort(options.sort).exec(function(err, result) {
        if(options.one) {
          return callback(err, result[0], null, null);      
        } else {
          return callback(err, result, null, null);      
        }
      });  
    } else {
      self.find(query, {}).cache(timeout).skip(options.after).limit(options.limit).sort(options.sort).exec(function(err, result) {
        if(options.one) {
          return callback(err, result[0], null, null);      
        } else {
          return callback(err, result, null, null);      
        }
      });  
    }
    return;  
  }

  if(Object.keys(options.sort)[0] === 'random') {
    // console.log('random query', query);
    self.findRandom(query, {}, {limit: options.limit}, function(err, result) {
      callback(err, _.map(result || [], function(element) { return element }));
    });
  } else {
    async.parallel([
      function(done) {
        self.count(query, {}).cache(timeout).exec(done);
      },
      function(done) {
        self.find(query, {}).cache(timeout).skip(options.after).limit(options.limit).sort(options.sort).exec(done);
      }
    ], function(err, result) {
      if(options.counter_only) {
        callback(null, result ? result[0] : 0);
      } else if(err || !result[1].length) {// || !result[1].length
        callback(err, null, null, null); // myError('Element you requested do not exist')
      } else if(result[1].length === 1 && options.one) {
        callback(err, _.map(result[1] || [], function(element) { return element })[0], null, options.summary ? result[0] : null);
      } else if(result[1].length) {
        callback(err, _.map(result[1] || [], function(element) { return element }), paging.build({total: result[0], after: options.current_page, limit: options.limit, endpoint: options.endpoint}), options.summary ? result[0] : null);
      }
    });
  } 
};

var applySchemaField = function(element, field) {
  if(field instanceof Object) {
    return objectPath.get(element, field[Object.keys(field)[0]])
  } else {
    return objectPath.get(element, field)
  }
}

modelSchema.methods.toSchema = function(schemaName, fields) {
  var self = this;
  fields = fields || {};
  return this.constructor.toSchema(self, schemaName, fields);
};

modelSchema.statics.toSchema = function(data, schemaName, fields) {
  var self = this, result = {};
  fields = fields && fields.length ? fields : modelSchema.statics.get_fields.call(self, schemaName);
  // console.log('fields', fields);
  _.map(fields, function(field) {
    return result[(field instanceof Object ? Object.keys(field)[0] : field)] = applySchemaField(data, field); 
  }, {});
  return result;    
}    

modelSchema.set('toJSON', { getters: true, virtuals: true });

modelSchema.plugin(random);
modelSchema.plugin(mongoosePaginate);

module.exports = modelSchema;