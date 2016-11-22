"use strict";

var fs = require('fs');
var env;
var envFile = __dirname + '/' + (process.env.NODE_ENV || 'production') + '.json';

// Read env.json file, if it exists, load the id's and secrets from that
// Note that this is only in the development env
// it is not safe to store id's in files

if (fs.existsSync(envFile)) {
  env = fs.readFileSync(envFile, 'utf-8');
  env = JSON.parse(env);
  Object.keys(env).forEach(function (key) {
    process.env[key] = env[key];
  });
}

module.exports = {
  name: 'ShopNow BackEnd Prod', 
  secret: '',
  web: 'https://shopnowapp.com',
  host: 'https://api.shopnowapp.com',
  error404: 'https://shopnowapp.com',
  api_endpoint: '/v1/api',
  port: 3000,
  ports: {
    front: 3500,
    api: 3000
  },
  db_name: 'shopnowapp-prod',
  db: 'mongodb://localhost/shopnowapp-prod',
  vat: {
    country: 'GB',
    number: ''
  },
  admins: [''],
  app: {
    admin_emails: []
  },
  stripe_token: '',
  amazon: {
    aws_access_key: '',
    aws_secret_key: '',
    aws_s3_bucket: '',
    aws_region: 'us-east-1'
  },
  facebook: {
    secretRTUKey: '',
    clientID: process.env.FACEBOOK_CLIENTID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "http://shopnowapp.com/auth/facebook/callback"
  }
};