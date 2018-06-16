
var express = require('express');

var app = express();
app.listen(3000, function () {
  console.log('Cookbox Server\nCreated by Alexander Sorochynskyi\nListening on localhost:3000\n');
});

var router = require('./router');
app.use('/recipe/', router);

// for tests
module.exports = app;