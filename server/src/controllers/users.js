"use strict";

var config = require('../config/config.js');
var async = require('async');
var _ = require('lodash');
var jwt    = require('jsonwebtoken');
var stripe = require('stripe')(config.stripe_token);
var crypto = require('crypto');

var createsend = require('createsend-node');
var mailing = new createsend({ apiKey: 'b3dd34135cc1df53e11825a848d2e7bc' });
var kue = require('kue');
var queue = kue.createQueue();

var Model = require('../services').User;

var Facebook = require('../local_modules/facebook');
var PushServer = require('../local_modules/pushserver');
var Helper = require('../local_modules/helper');
var paging = require('../local_modules/paging');
var vatMoss = require('../local_modules/vatmoss');

var endpoint = config.host + config.api_endpoint;

exports.get_all = function(req, res, next) {
  var header = parse_query(req);
  
  async.waterfall([
    function(done) {
      Model.get_all(header.query, {schema: header.options.schema, summary: header.options.summary, limit: header.options.limit, after: header.options.after}, done);
    },
    function(result, paging, summary, done) {
      Model.format_object(result, header, paging, summary, done);
    }
  ], function(err, result, paging, summary) {
    res.json(Helper.format_response(err, {data: result, paging: paging, summary: summary}));    
  })
}

exports.add_like = function(req, res, next) {
  async.waterfall([
    function(done) {
      Model.add_like(req.signed.id, req.query.page_id, done);
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));    
  })
}

exports.enable_notifications = function(req, res, next) {
  async.waterfall([
    function(done) {
      req.user.enable_notifications(done);
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.disable_notifications = function(req, res, next) {
  async.waterfall([
    function(done) {
      req.user.disable_notifications(done);
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}


exports.add_subscription = function(req, res, next) {
  async.waterfall([
    function(done) {
      req.user.add_subscription(req.query.page_id, done);
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.ask_for_discount = function(req, res, next) {
  async.waterfall([
    function(done) {
      req.user.ask_for_discount(req.query.page_id, function(err, result) {
        done(err, result);
      });
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.register_device = function(req, res, next) {
  async.waterfall([
    function(user, paging, summary, done) {
      req.user.register_device(req.query.token, req.query.platform, req.query.onesignal_id, done);
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.save_post = function(req, res, next) {
  var header = parse_query(req);
  _.extend(header.options, {user_id: get_user_id(req)});

  async.waterfall([
    function(done) {
      Model.get_me(header.query, {facebook_id: header.options.user_id, schema: header.options.schema, user: header.options.user}, done)
    },
    function(user, paging, summary, done) {
      if(!user) {
        return done('Missing user');
      }
      user.save_post(req.query.post_id, function() {
        done();
      });
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.unsave_post = function(req, res, next) {
  var header = parse_query(req);
  _.extend(header.options, {user_id: get_user_id(req)});

  async.waterfall([
    function(done) {
      Model.get_me(header.query, {facebook_id: header.options.user_id, schema: header.options.schema, user: header.options.user}, done)
    },
    function(user, paging, summary, done) {
      if(!user) {
        return done('Missing user');
      }
      Model(user).unsave_post(req.query.post_id, done);
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.share_page = function(req, res, next) {
  var header = parse_query(req);
  _.extend(header.options, {user_id: get_user_id(req)});

  async.waterfall([
    function(done) {
      Model.get_me(header.query, {facebook_id: header.options.user_id, schema: header.options.schema, user: header.options.user}, done)
    },
    function(user, paging, summary, done) {
      if(!user) {
        return done('Missing user');
      }
      user.share_page(req.query.page_id, function() {
        if(user.onesignal_id) {
          PushServer.send(user.onesignal_id, {message: req.user.first_name + ' ' + req.user.last_name + ' shared ' + req.query.page_name + ' profile with you', data: {view: 'shopnow.stores'}}, done);
        } else {
          done();
        }
      });
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.unshare_page = function(req, res, next) {
  var header = parse_query(req);
  _.extend(header.options, {user_id: get_user_id(req)});

  async.waterfall([
    function(done) {
      Model.get_me(header.query, {facebook_id: header.options.user_id, schema: header.options.schema, user: header.options.user}, done)
    },
    function(user, paging, summary, done) {
      if(!user) {
        return done('Missing user');
      }
      Model(user).unshare_page(req.query.page_id, done);
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.remove_subscription = function(req, res, next) {
  async.waterfall([
    function(done) {
      req.user.remove_subscription(req.query.page_id, done);      
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  })
}

exports.get_subscriptions = function(req, res, next) {
  async.waterfall([
    function(user, paging, summary, done) {
      Model.subscriptions({user_id: req.signed.id}, {after: req.query.after, sort: {random: 1}}, done);      
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, result));
  })
}

exports.get_subscriptions_active = function(req, res, next) {
  async.waterfall([
    function(done) {
      Model.subscriptions_active({user_id: req.signed.id}, {after: req.query.after, sort: {random: 1}}, done);      
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, result));
  })
}

exports.update = function(req, res, next) {
  if(!req.query.key) {
    return res.json(Helper.format_response('Missing key parameter'));
  }
  async.waterfall([
    function(done) {
      var data = {};
          data[req.query.key] = req.query.value;
      Model(req.user).update_object(data, done);
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, {status: 'success', data: result}));
  });
}

exports.import_likes = function(req, res, next) {
  async.waterfall([
    function(done) {
      Model(req.user).import_links({loop: false, max: 1}, done)
    },
    function(user, report, done) {
      Model(req.user).mark_ready();
      Model(req.user).mark_synched();
      done(null, report);
    }    
  ], function(err, result) {
    res.json({verified: result.verified, unverified: result.unverified})
  })
}

exports.oauth = function(req, res, next) {
  var options = {
    email: req.query.email,
    access_token: req.query.access_token,
    lastVersion: req.version, 
    platform: req.platform
  }
  
  var me = null;
  
  async.waterfall([
    function(done) {
      Facebook.me({access_token: options.access_token, email: options.email}, done)
    },
    function(user, done) {
      me = user;
      Facebook.get_access_token({access_token: options.access_token}, done);
    },
    function(token, done) {
      _.extend(me, {access_token: token.access_token, has_errors: false})
      if(req.query.is_business) {
        _.extend(me, {is_business: req.query.is_business || false, is_synched_business: false})
      }
      
      Model.create_object({id: me.facebook_id, data: me}, done);
    },
    function(user, done) {
      if(user.isNew) {
        console.log('adding new user');
        mailing.subscribers.addSubscriber('e8e56a7a16513a9ac28e90e6fb5a3af8', {EmailAddress: user.email, Name: user.name}, function(err, result) {
          done(null, user);
        });
      } else {
        console.log('looks like it is not new');
        done(null, user);
      }
    },
    function(user, done) {
      if(user.isNew) {
        var job = queue.create('register_user', {
            user: user
        }).save( function(err){
          if( !err ) console.log( job.id );
          done(null, user);
        });
      } else {
        done(null, user);
      }      
    }
  ], function(err, user) {
    if(!err) {
      return res.json(Helper.format_response(err, {access_token: jwt.sign({id: user.facebook_id}, config.secret, {})}));
    } else {
      return res.status(401).json(Helper.format_response(err, {}));
    }
  })
}

exports.auth = function(req, res, next) {
  var options = {
    access_token: config.facebook.clientID + '|' + config.facebook.clientSecret,
    lastVersion: req.version, 
    platform: req.platform
  }
  
  var me = null;
  
  async.waterfall([
    function(done) {
      var hash = crypto.createHash("md5").update(req.query.password).digest('hex');
      
      var me = {
        access_token: options.access_token,
        facebook_id: req.query.email,
        email: req.query.email,
        password: hash
      }
      Model.create_object({id: req.query.email, data: me, skip: true}, done);
    },
    function(user, done) {
      if(user.isNew) {
        console.log('adding new user');
        mailing.subscribers.addSubscriber('e8e56a7a16513a9ac28e90e6fb5a3af8', {EmailAddress: user.email, Name: user.name}, function(err, result) {
          done(null, user);
        });
      } else {
        var hash = crypto.createHash("md5").update(req.query.password).digest('hex');
        if(hash !== user.password) {
          return done('Authentication failed');
        }
        console.log('looks like it is not new');
        done(null, user);
      }
    },
    function(user, done) {
      if(user.isNew) {
        var job = queue.create('register_user', {
            user: user
        }).save( function(err){
          if( !err ) console.log( job.id );
          done(null, user);
        });
      } else {
        done(null, user);
      }      
    }
  ], function(err, user) {
    if(!err) {
      return res.json(Helper.format_response(err, {access_token: jwt.sign({id: user.facebook_id}, config.secret, {})}));
    } else {
      return res.status(401).json(Helper.format_response(err, {}));
    }
  })
}

exports.me = function(req, res, next) {
  var header = parse_query(req);
  _.extend(header.options, {user_id: get_user_id(req)});
  
  async.waterfall([
    function(done) {
      Model.get_me(header.query, {facebook_id: header.options.user_id, schema: header.options.schema, user: header.options.user, timeout: -1}, done)
    },
    function(user, paging, summary, done) {
      if(!user) {
        return done('Missing user');
      }
      user.query(header.query, {schema: header.options.schema, fields: header.options.fields, exclude_ids: header.options.exclude_ids, user: header.options.user, sort: header.options.sort, after: header.options.after, limit: header.options.limit, simplified: header.options.simplified}, done)
    }
  ], function(err, result) {
    res.json(Helper.format_response(err, Helper.clean_json(result)));
  })
}

exports.count_all = function(req, res, next) {
  Model.count_all(function(err, result) {
    res.json({total: result});
  })
}

exports.count_all_requests = function(req, res, next) {
  Model.count_all_requests(function(err, result) {
    res.json({total: result});
  })
}

exports.set_admins = function(req, res, next) {
  Model.set_admins(config.app.admin_emails, function(err, result) {
    res.json({status: 'success'});
  })
}

exports.debug = function(req, res, next) {
  Facebook.debug({input_token: req.query.input_token}, function(err, result) {
    if(result.user_id) {
      if(config.admins.indexOf(result.user_id) > -1) {
        result.is_admin = true;
      }
    }
    res.json(result);
  });
}


exports.validate_vat = function(req, res, next) {
  async.waterfall([
    function(done) {
      Model.get_me({}, {facebook_id: req.params.user_id, schema: 'default'}, done)
    },
    function(user, paging, summary, done) {
      vatMoss.get_status(user.billing_address.vat,
        function(err, vat) {
          if (err) {
            return res.json({status: 'error'});
          }
          user.update({vat_rate: vat.vat_rate, customer_valid_vat_number: vat.customer_valid_vat_number}, function() {
            done(err, vat);
          })
        }
      );  
    }
  ], function(err, result) {
    res.json({status: 'success', data: result});
  })  
}

exports.payment = function(req, res, next) {
  var stripeToken = req.body.stripe_token;
  var vat_rate = 20;
  
  // add vat number validation, if OK then vat_rate = 0;
  
  console.log('body', req.body);
  
  if(req.body.metadata.customer_valid_vat_number && req.body.metadata.country !== 'GB') {
    vat_rate = 0;
  }

  // add tax_percent;
  stripe.customers.create({
    source: stripeToken,
    plan: req.body.plan,
    email: req.body.email,
    metadata: req.body.metadata,
    tax_percent: vat_rate
  }, function(err, customer) {
    if (err && err.type === 'StripeCardError') {
      return res.json({status: 'error'});
    }
    console.log('customer', customer);
    req.user.upgrade_plan(customer, function(err, result) {
      res.json({status: 'success', data: customer});
    })
  });
}

exports.update = function(req, res, next) {
  Model.update({'facebook_id': req.params.user_id}, {$set: req.body}).exec(function() {
    res.json({status: 'success'});
  });
}


/*
  SUPPORT METHODS
*/

var get_user_id = function(req) {
  return req.params.user_id === 'me' ? req.signed.id : req.params.user_id;
}

var parse_query = function(req) {
  var fields = (req.params.field || req.query.fields || '').trim();
  var options = {
    fields: fields.length ? fields.split(',') : '', 
    schema: req.signed.schema_type,
    summary: req.query.summary,
    limit: req.query.limit,
    after: req.query.after,
    sort: req.query.sort,
    user_id: req.query.user_id, 
    user: req.user,
    simplified: req.query.simplified,
    exclude_ids: req.query.exclude_ids ? req.query.exclude_ids.split(',') : []
  }
  var query = {
    q: req.query.q,
    age: req.query.age,
    gender: req.query.gender
  }
  return {
    options: options,
    query: query
  }  
}
