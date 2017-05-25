'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 8080;
  app.listen(appEnv.port, '0.0.0.0', function() {
    console.log("Server listening on " + appEnv.url);
  });
});
