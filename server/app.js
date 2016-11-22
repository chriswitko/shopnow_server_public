/* global isAuthenticated */
var config = require('./src/config/config.js');

var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var mongoose = require('mongoose');
var methodOverride = require('method-override');
var cors = require('cors');
var path = require('path');
var ejs = require('ejs');
var compression = require('compression');
require('./src/local_modules/cache').install(mongoose, {max:50, maxAge:1000*60*0.09});

// define the versions
var VERSIONS = {
  'Pre-Production': '/v0', 
  'Version 1': '/v1'
};

// process.on('uncaughtException', function (err) {
//   console.error('global exception:', err.message);
// });

process.on('unhandledRejection', function (reason, promise) {
  console.error('unhandled promise rejection:', reason.message || reason);
});

// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1, numberOfRetries: 5, retryMiliSeconds: 5000 } } };
  return mongoose.connect(config.db, options, function(err) {
    if (err) {
      console.error('Failed to connect to mongo on startup - retrying in 5 sec', err);
      setTimeout(connect, 5000);
    }    
  });
};

connect();

mongoose.connection.on('error', console.log);
// mongoose.connection.on('disconnected', connect);

// Close the Mongoose connection, when receiving SIGINT
process.on('SIGINT', function() {
  mongoose.connection.close(function () {
      console.log('Force to close the MongoDB conection');
      process.exit(0);
  });
});

ejs.delimiter = '$';

app.on('error', function (err, ctx) {
  console.error('Express app error', err.stack)
  console.error('on url', ctx.req.url)
  console.error('with headers', ctx.req.headers)
})

app.use(cors());
app.use(compression()); //use compression

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(express.static('build'));
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

app.set('views', './build');
app.set('view engine', 'ejs');
app.engine('html', ejs.renderFile);

app.get('/api', function(req, res) {
    res.json(VERSIONS);
})

// versioned routes go in the routes/ directory
// import the routes
for (var k in VERSIONS) {
    app.use(VERSIONS[k], require('./src/routes' + VERSIONS[k]));
}

app.get('*', function (req, res) {
  res.status(404).json({'error': 'Endpoint not found (404)'});;
});

app.use(function (req, res, next) {
   res.locals = {
     config: config
   };
   next();
});

app.use(methodOverride());
app.use(function(err, req, res, next) {
  console.error('stack', err.stack);
  res.status(500).json({status: 'error', 'message': err.toString()});
});

console.info('APP:NAME', config.name);
console.info('APP:FOLDER', __dirname);
console.info('APP:PORT', config.ports.api);

var server = app.listen(config.ports.api, function () {
  console.info('APP:URL', config.host);
});