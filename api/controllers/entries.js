// TODO: make env var or such
var DB_NAME = 'vvs-delay-db-dev';
var db = require('../../config/db.js')(DB_NAME);

module.exports = {getById, getByTimestamp};

function getById(req, res, next) {
  var id = req.swagger.params.id.value; //req.swagger contains the path parameters
  console.log("Looking for entry with id " + id);
  db.find({selector: {_id: {$eq: id}}}, function(err, data) {
    if (err) {
      res.json(err);
    }
    res.json(data);
  });
}

function getByTimestamp(req, res, next) {
  var from = req.swagger.params.startTime.value;
  var to = req.swagger.params.endTime.value;
  var selector = {timestamp: {}};
  if (from) {
    selector.timestamp['$gte'] = from;
  }
  if (to) {
    selector.timestamp['$lt'] = to;
  }
  db.find({selector: selector}, function(err, data) {
    if (err) {
      res.json(err);
    }
    res.json(data);
  });
}
