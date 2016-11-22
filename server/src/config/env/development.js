"use strict";

var fs = require('fs');
var env;
var envFile = __dirname + '/' + (process.env.NODE_ENV || 'development') + '.json';

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
  name: 'ShopNow BackEnd Dev', 
  secret: '',
  web: 'http://localhost:5500',
  host: 'http://localhost:5000',
  error404: 'https://shopnowapp.com',
  api_endpoint: '/v1/api',
  ports: {
    front: 5500,
    api: 5000
  },
  db_name: 'shopnowapp-dev',
  db: 'mongodb://localhost/shopnowapp-dev',
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
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  }
};