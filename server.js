var express = require('express');
var app = express();
var Cloudant = require('cloudant');
var fs = require('fs');

var express = require('express');
var app = express();
var cfenv = require('cfenv');
var appEnv = cfenv.getAppEnv();

// TODO: make env var or such
var DB_NAME = 'test';
var db = getDB(DB_NAME);

// TODO: separate functions from router
app.route("/documents/:id")
  .get(function(req, res) {
    db.find({selector: {_id: req.params.id}}, function(err, data) {
      if (err) {
        res.json(err);
      }
      res.json(data);
    })
  });

// TODO: maybe pretty route overview on "GET /", error message on all others
app.route("*")
  .get(function(req, res) {
    res.json({
      message: "Welcome. This route doesn't exist (yet?)",
      connected_db: DB_NAME,
      supported_routes: [
        {
          path: "/documents/<id>",
          method: "GET",
          descr: "Returns document with given id"
        }
      ]
    })
  });

app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("Server listening on " + appEnv.url);
});

function getDB(dbname) {
  var services;
  if (process.env.VCAP_SERVICES) {
    console.log("Found ENV VCAP_SERVICES");
    services = JSON.parse(process.env.VCAP_SERVICES);
  } else {
    console.log("Loading vcap-local.json");
    var data = JSON.parse(fs.readFileSync('vcap-local.json', 'utf8'));
    services = data.VCAP_SERVICES;
  }
  if (!services) {
    return console.log("Error: Could not find VCAP_SERVICES");
  }
  var cloudant = Cloudant({vcapServices: services});
  console.log("Connected to DB '" + DB_NAME + "'");

  return cloudant.db.use(dbname);
}
