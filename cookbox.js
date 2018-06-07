
var express = require('express');

var app = express();
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

var router = require('./router');
app.use('/recipe/', router);