var fs = require('fs');
var Cloudant = require('cloudant');

module.exports = function(dbName) {
  var services;
  if (process.env.VCAP_SERVICES) {
    console.log("Found ENV VCAP_SERVICES");
    services = JSON.parse(process.env.VCAP_SERVICES);
  } else {
    console.log("Loading vcap-local.json");
    console.log("Directory: " + __dirname);
    var data = JSON.parse(fs.readFileSync(__dirname + '/vcap-local.json', 'utf8'));
    services = data.VCAP_SERVICES;
  }
  if (!services) {
    return console.log("Error: Could not find VCAP_SERVICES");
  }
  var cloudant = Cloudant({vcapServices: services});
  console.log("Connected to DB '" + dbName + "'");

  return cloudant.db.use(dbName);
}
