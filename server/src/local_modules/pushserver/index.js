"use strict";

var config = require('../../config/config.js');

var onesignal = require('node-opensignal-api');
var onesignal_client = onesignal.createClient();

var restApiKey = 'ZTc2YTM0NTQtZmJiOS00YjVkLTk4MmEtMzljOGNiOTUxMWVk';

var params = {
    app_id: '32eaf9d1-2dff-4f1c-907c-2ae7bd6c4a2e',
    contents: {
        'en': 'You have new offers \ue112',
    },
    ios_badgeType: 'SetTo',
    ios_badgeCount: 1,
    include_player_ids: []
};

exports.send = function(onesignal_id, options, callback) {
  if(onesignal_id) {
    params.contents['en'] = options.message;
    params.include_player_ids = [onesignal_id];
    params.data = options.data || {};
    onesignal_client.notifications.create(restApiKey, params, function (err, response) {
      if (err) {
        console.log('Encountered error', err);
      } else {
        console.log(response);
      }
      callback();    
    });
  } else {
    callback();
  }
}

