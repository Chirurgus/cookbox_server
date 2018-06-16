
var express = require('express');

var app = express();
app.listen(3000, function () {
  console.log('Cookbox Server\nCreated by Alexander Sorochynskyi\nListening on localhost:3000');
});

var router = require('./router');
app.use('/recipe/', router);