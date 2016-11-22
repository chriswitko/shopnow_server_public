// Version 0 
var express = require('express');
var app = module.exports = express();

 // middleware that only applies to this version of the API
// app.use(customAuth());

// normal routes, all will be pre-fixed by the version
// app.get('/contacts', contacts.index) // /v0/contacts