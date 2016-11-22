/* global isAuthenticated */
var config = require('../server/src/config/config.js');

var express = require('express');
var router = express.Router();
var app = express();
var bodyParser = require('body-parser')
var methodOverride = require('method-override');
var favicon = require('serve-favicon');
var cors = require('cors');
var path = require('path');
var compression = require('compression');
var ejs = require('ejs');
var request = require('request');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var shortid = require('shortid');
var util = require('util');
var fs = require('fs');
var aws = require('aws-sdk');
var flow = require('./local_modules/flow')('/tmp/shopnowapp');

process.on('uncaughtException', function (err) {
  console.error('global exception:', err.message);
});

process.on('unhandledRejection', function (reason, promise) {
  console.error('unhandled promise rejection:', reason.message || reason);
});

app.on('error', function (err, ctx) {
  console.error('Express app error', err.stack)
  console.error('on url', ctx.req.url)
  console.error('with headers', ctx.req.headers)
})

aws.config.update({ accessKeyId: config.amazon.aws_access_key, secretAccessKey: config.amazon.aws_secret_key, region: config.amazon.aws_region});

ejs.delimiter = '?';
app.use(cors());
app.use(compression()); //use compression

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.set('views', './build');
app.use(express.static('build'));
app.use(favicon(__dirname + '/src/assets/img/favicon.ico'));
app.use('/', router);

app.engine('.html', ejs.renderFile);
app.set('view engine', 'html');

exports._uploadStatic = function(path, ext, filename, cb) {
  var fileStream = fs.createReadStream(path);
  fileStream.on('error', function (err) {
    if (err) {
      return cb(new Error('File download error'));
    }
  });
  fileStream.on('open', function () {
    var s3 = new aws.S3();
    s3.putObject({
      Bucket: config.amazon.aws_s3_bucket,
      Key: filename + ext,
      Body: fileStream,
      ACL: 'public-read'
    }, function (resp) {
      s3.getSignedUrl('getObject', {Bucket: config.amazon.aws_s3_bucket, Key: filename + ext, Expires: 2592000}, function (err, url) {
        if (err) {
          return cb(new Error('File download error'));
        }
        fs.unlink(path, function() {
          cb({filename: filename, url: url});
        });
      })
    });

  });
}

var ACCESS_CONTROLL_ALLOW_ORIGIN = false;

// Handle uploads through Flow.js
app.post('/upload', multipartMiddleware, function(req, res) {
  flow.post(req, function(status, filename, original_filename, identifier) {
    exports._uploadStatic(path.resolve('/tmp/shopnowapp', identifier), '.png', identifier, function(output) {
      console.log('output img', output);
      if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
        res.header("Access-Control-Allow-Origin", "*");
      }
      // res.status(status).send();
      res.json({url: output.url});
    });

  });
});


router.options('/upload', function(req, res){
  console.log('OPTIONS');
  if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.status(200).send();
});

// Handle status checks on chunks through Flow.js
router.get('/upload', function(req, res) {
  flow.get(req, function(status, filename, original_filename, identifier) {
    console.log('GET', status);
    if (ACCESS_CONTROLL_ALLOW_ORIGIN) {
      res.header("Access-Control-Allow-Origin", "*");
    }

    if (status == 'found') {
      status = 200;
    } else {
      status = 204;
    }

    res.status(status).send();
  });
});

router.get('/download/:identifier', function(req, res) {
  flow.write(req.params.identifier, res);
});

// router.get('/about', function (req, res) {
//   res.redirect('https://medium.com/@chriswitko/f483b103c4d1');
// });

// router.get('/help', function (req, res) {
//   res.redirect('https://medium.com/shopnow-app');
// });

router.get('/go', function(req, res) {
  var info = {};
  if(req.query.url) {
    res.render('redirect', {
      locals: {
        url: req.query.url
      }
    });
    // res.redirect(req.query.url);
  } else {
    request(config.host + config.api_endpoint + '/link?obj_name=' + req.query.obj_name + '&obj_id=' + req.query.obj_id + '&access_token=' + req.query.access_token, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        info = JSON.parse(body);
      }
      if(info && info.url) {
        // res.redirect(info.url);
        res.render('redirect', {
          locals: info
        });
      } else {
        res.redirect(config.error404);
      }
    });
  }
});

router.get('/add/:facebook_id', function (req, res) {
  console.log('rendering', req.params.facebook_id);
  var info = {};

  console.log(config.host + config.api_endpoint + '/brand/' + req.params.facebook_id + '/public');
  request(config.host + config.api_endpoint + '/brand/' + req.params.facebook_id + '/public', function (error, response, body) {
    console.log('body', body);
    if (!error && response.statusCode === 200) {
       info = JSON.parse(body);
    }
    
    if(info) {
      res.render('home', {
        locals: info
      });
    } else {
      res.redirect('/');
    }
  })
  

});

var isPageOwner = function(req, res, next) {
  request(config.host + config.api_endpoint + '/token/debug?input_token=' + req.query.token, function (error, response, body) {
    try {
      var info = JSON.parse(body);
      if(info && (info.is_admin === true || req.params.page_id === info.profile_id)) {
        return next();
      }
      res.redirect('/business');
    } catch(err) {
      res.redirect('/business');
    }
  })
}

var isAdmin = function(req, res, next) {
  request(config.host + config.api_endpoint + '/token/debug?input_token=' + req.query.token, function (error, response, body) {
    var info = JSON.parse(body);
    if(info && info.is_admin === true) {
      return next();
    }
    res.redirect('/business');
  })
}

router.get('/about', function (req, res) {
  res.render('home', {locals: {}});
});

router.get('/help', function (req, res) {
  res.render('home', {locals: {}});
});

router.get('/terms', function (req, res) {
  res.render('home', {locals: {}});
});

router.get('/privacy', function (req, res) {
  res.render('home', {locals: {}});
});

router.get('/business', function (req, res) {
  res.render('home', {locals: {}});
});

router.get('/admin', isAdmin, function (req, res) {
  if(!req.query.token) {
    return res.redirect('/business');
  }
  res.render('home', {locals: {}});
});

router.get('/ios', function (req, res) {
  return res.redirect('https://itunes.apple.com/us/app/shop-now/id1090673418?ls=1&mt=8');
});

router.get('/admin/*', isAdmin, function (req, res) {
  if(!req.query.token) {
    return res.redirect('/business');
  }
  res.render('home', {locals: {}});
});

router.get('/account', function (req, res) {
  if(!req.query.token) {
    return res.redirect('/business');
  }
  res.render('home', {locals: {}});
});

router.get('/account/*', function (req, res) {
  if(!req.query.token) {
    return res.redirect('/business');
  }
  res.render('home', {locals: {}});
});


router.get('/manage', function (req, res) {
  res.render('home', {locals: {}});
});

router.get('/manage/:page_id/*', isPageOwner, function (req, res) {
  if(!req.query.token) {
    return res.redirect('/business');
  }
  res.render('home', {locals: {}});
});

router.get('/manage/:page_id', isPageOwner, function (req, res) {
  if(!req.query.token) {
    return res.redirect('/business');
  }
  res.render('home', {locals: {}});
});

router.get('/', function (req, res) {
  res.render('home', {locals: {}});
});

app.use(methodOverride());

app.use(function(err, req, res, next) {
  console.error('stack', err.stack);
  res.status(500).json({'error': err.toString()});
});

var server = app.listen(process.env.PORT || config.ports.front, function () {
  console.info('FRONT READY');
});