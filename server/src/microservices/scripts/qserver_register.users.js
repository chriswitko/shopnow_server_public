var config = require('../../config/config.js');
var async = require('async');
var kue = require('kue');
var queue = kue.createQueue();
var mongoose = require('mongoose')
require('../../local_modules/cache').install(mongoose, {max:50, maxAge:1000*60*0.5});

console.log('Connecting to DB: ' + config.db);
var options = { server: { socketOptions: { keepAlive: 12000 } } };
mongoose.connect(config.db, options);

var User = require('../../services').User;

var verified = 0, unverified = 0;

queue.process('register_user', function(job, done){
  process_user(new User(job.data.user), done);
});

console.log('Start at', new Date());

function process_user(user, done) {
  var self = this;
  
  console.log('Processing user', user.facebook_id, user.first_name, user.last_name);
  
  var loop = user.is_ready ? false : true;
    
  var tasks = [];
  if(user.email !== user.facebook_id && user.access_token) {
    tasks.push(user.import_likes.bind(user, {loop: loop, max: 50, skip: true}));
  }
  
  tasks.push(user.mark_ready.bind(user));
  tasks.push(user.mark_synched.bind(user))  
    
  async.series(tasks, function(err, result) {
    if(err) {
      console.log('ERR', err);
      if(!user.access_token) {
        user.update({$set: {has_errors: false, is_ready: true, is_synched: true}}, function() {
          self.resume();
        })        
      } else {
        user.mark_has_errors(function() {
          done();
        });
      }
    } else {
      verified += result[0].verified;
      unverified += result[0].unverified;
      user.mark_has_no_errors(function() {
        console.log('done', user.facebook_id);
        done();
      });
    }
  })
}