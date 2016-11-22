"use strict";

var config = require('../config/config.js');
var jwt = require('jsonwebtoken');
var myError = require('../local_modules/myerror');
var Facebook = require('../local_modules/facebook');

var User = require('../services/user');

exports.is_authenticated = function(req, res, next) {
  var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token'];
  var purge = req.body.purge || req.query.purge || req.headers['x-purge'];
  var platform = req.body.platform || req.query.platform || req.headers['x-platform'] || 'web';
  var version = req.body.version || req.query.version || req.headers['x-version'] || '0.0.1.web';

  if(!access_token) {
    return res.json({error: myError('Authentication error. Missing token.')});
  }

  jwt.verify(access_token, config.secret, function(err, signed) {
    if (err) {
      return res.json({ error: myError('Failed to authenticate token.') });
    } else {
      if(err) {
        return res.json({ error: myError('Authentication error. Token invalid.') });
      } else {
        User.raw({}, {facebook_id: signed.id, schema: 'default'}, function(err, user) {
          if(err || !user) {
            return res.json({error: myError('Element not found.')});
          }
          signed.schema_type = user.is_admin ? 'admin' : ((user.facebook_id === (req.params.user_id === 'me' ? signed.id : req.params.user_id)) ? 'owner' : 'default');
          req.user = user;
          req.signed = signed;
          req.version = version;
          req.platform = platform;
          req.purge = purge;
          next();
        });
      }
    }
  });
};

exports.is_signed = function(req, res, next) {
  var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token'];
  var purge = req.body.purge || req.query.purge || req.headers['x-purge'];
  var platform = req.body.platform || req.query.platform || req.headers['x-platform'] || 'web';
  var version = req.body.version || req.query.version || req.headers['x-version'] || '0.0.1.web';

  if(!access_token) {
    return res.json({error: myError('Authentication error. Missing token.')});
  }

  jwt.verify(access_token, config.secret, function(err, signed) {
    if (err) {
      return res.json({ error: myError('Failed to authenticate token.') });
    } else {
      if(err) {
        return res.json({ error: myError('Authentication error. Token invalid.') });
      } else {
        req.signed = signed;
        next();
      }
    }
  });
};

exports.is_admin = function(req, res, next) {
  var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token'];
  var purge = req.body.purge || req.query.purge || req.headers['x-purge'];
  var platform = req.body.platform || req.query.platform || req.headers['x-platform'] || 'web';
  var version = req.body.version || req.query.version || req.headers['x-version'] || '0.0.1.web';

  if(!access_token) {
    return res.json({status: 'error', message: 'Authentication error. Missing token.'});
  }

  jwt.verify(access_token, config.secret, function(err, signed) {
    if (err) {
      return res.json({ error: myError('Failed to authenticate token.') });
    } else {
      if(err) {
        return res.json({ error: myError('Authentication error. Token invalid.') });
      } else {
        User.raw({}, {facebook_id: signed.id, schema: 'default'}, function(err, user) {
          if(err || !user.is_admin) {
            return res.json({ error: myError('You need Admin privileges.') });
          }
          signed.schema_type = 'admin';
          req.user = user;
          req.signed = signed;
          req.version = version;
          req.platform = platform;
          req.purge = purge;
          next();
        });
      }
    }
  });
};

exports.is_owner = function(req, res, next) {
  var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token'];
  var purge = req.body.purge || req.query.purge || req.headers['x-purge'];
  var platform = req.body.platform || req.query.platform || req.headers['x-platform'] || 'web';
  var version = req.body.version || req.query.version || req.headers['x-version'] || '0.0.1.web';

  if(!access_token) {
    return res.json({status: 'error', message: 'Authentication error. Missing token.'});
  }

  jwt.verify(access_token, config.secret, function(err, signed) {
    if (err) {
      return res.json({ error: myError('Failed to authenticate token.') });
    } else {
      if(err) {
        return res.json({ error: myError('Authentication error. Token invalid.') });
      } else {
        User.raw({}, {facebook_id: signed.id, schema: 'default'}, function(err, user) {
          if(err) {
            return next();
          }
          signed.schema_type = user.is_admin ? 'admin' : ((user.facebook_id === (req.params.user_id === 'me' ? signed.id : req.params.user_id)) ? 'owner' : 'default');
          if(signed.schema_type === 'default') {
            return res.json({ error: myError('You need Owner or Admin privileges.') });
          }
          req.user = user;
          req.signed = signed;
          req.version = version;
          req.platform = platform;
          req.purge = purge;
          next();
        });
      }
    }
  });
};

exports.is_page_owner = function(req, res, next) {
  var page_id = req.params.page_id;
  var token = req.body.token || req.query.token || req.headers['x-token'];
  var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token'];
  var purge = req.body.purge || req.query.purge || req.headers['x-purge'];
  var platform = req.body.platform || req.query.platform || req.headers['x-platform'] || 'web';
  var version = req.body.version || req.query.version || req.headers['x-version'] || '0.0.1.web';

  if(!access_token) {
    return res.json({status: 'error', message: 'Authentication error. Missing token.'});
  }

  jwt.verify(access_token, config.secret, function(err, signed) {
    if (err) {
      return res.json({ error: myError('Failed to authenticate token.') });
    } else {
      if(err) {
        return res.json({ error: myError('Authentication error. Token invalid.') });
      } else {
        User.raw({}, {facebook_id: signed.id, schema: 'default'}, function(err, user) {
          if(err) {
            return next();
          }
          if(token) {
            Facebook.debug({input_token: token}, function(err, result) {
              if(user.is_admin || (result.user_id === signed.id && result.profile_id === page_id)) {
                signed.schema_type = user.is_admin ? 'admin' : 'owner';                
              } else {
                signed.schema_type = 'default';
              }
              req.user = user;
              req.signed = signed;
              req.version = version;
              req.platform = platform;
              req.purge = purge;
              // console.log('by token', signed);
              next();
            });
          } else {
            signed.schema_type = user.is_admin ? 'admin' : ((!!~user.admin_pages.indexOf(signed.id)) ? 'owner' : 'default');
            req.user = user;
            req.signed = signed;
            req.version = version;
            req.platform = platform;
            req.purge = purge;
            // console.log('by user', signed);
            next();
          }
        });
      }
    }
  });
};

exports.is_offer_owner = function(req, res, next) {
  var access_token = req.body.access_token || req.query.access_token || req.headers['x-access-token'];
  var purge = req.body.purge || req.query.purge || req.headers['x-purge'];
  var platform = req.body.platform || req.query.platform || req.headers['x-platform'] || 'web';
  var version = req.body.version || req.query.version || req.headers['x-version'] || '0.0.1.web';

  if(!access_token) {
    return res.json({status: 'error', message: 'Authentication error. Missing token.'});
  }

  jwt.verify(access_token, config.secret, function(err, signed) {
    if (err) {
      return res.json({ error: myError('Failed to authenticate token.') });
    } else {
      if(err) {
        return res.json({ error: myError('Authentication error. Token invalid.') });
      } else {
        User.raw({}, {facebook_id: signed.id, schema: 'default'}, function(err, user) {
          if(err) {
            return next();
          }
          // this need to check if page is owner of offer
          signed.schema_type = user.is_admin ? 'admin' : ((!!~user.admin_pages.indexOf(signed.id)) ? 'owner' : 'default');
          // if(signed.schema_type === 'offer_default') {
          //   return res.json({ error: myError('You need Owner or Admin privileges.') });
          // }
          req.user = user;
          req.signed = signed;
          req.version = version;
          req.platform = platform;
          req.purge = purge;
          next();
        });
      }
    }
  });
};