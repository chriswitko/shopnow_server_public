"use strict";

var Link = require('../services').Link;

exports.go = function(req, res, next) {
  var link = new Link;
  link.get_url({obj_name: req.query.obj_name, obj_id: req.query.obj_id, access_token: req.user.access_token}, function(err, data) {
    res.json(data);
  });
}

exports.redirect = function(req, res, next) {
  var link = new Link;
  link.get_url({obj_name: req.query.obj_name, obj_id: req.query.obj_id}, function(err, data) {
    if(data.url) {
      // res.json({url: data.url});
      res.redirect(data.url);
    } else {
      res.json({status: 'error', data: data});
    }
  });
}
