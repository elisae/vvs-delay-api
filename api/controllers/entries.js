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
  var selector = {
    "selector": {
      "$and": [{
        "timestamp": {
          "$gte": from,
          "$lt": to
        }}
      ]},
      "fields": [
        "_id",
        "timestamp",
        "station",
        "results"
      ],
      "sort": [
        {
          "timestamp": "desc"
        }
      ]
    };
  if (req.swagger.params.filterEmpty.value) {
    console.log("Filtering empties");
    selector.selector.$and.push({
      "results.lines": {
        "$ne": {}
      }});
  }
  db.find(selector, function(err, data) {
    if (err) {
      res.json(err);
    }
    if (req.swagger.params.transform.value) {
      console.log("Transforming data");
      var transformed = transform(data);
      var stats = {
        count: transformed.length,
        timestamps: getKeys(transformed, "timestamp")
      }
      res.json({stats: stats, docs: transformed});
    } else {
      res.json(data);
    }
  });
}

function transform(data) {
  var result = [];
  data.docs.forEach(function(doc) {
    var newEntry = false;
    var timestamp = Math.floor(doc.timestamp/10000) * 10000;
    var r = findEntryByTimestamp(result, timestamp);
    if (Object.keys(r).length == 0) {
      newEntry = true;
      r["stats"] = {
        count: 0,
        stations: [],
        crawledTimestamps: [],
        docIds: []
      };
      r["timestamp"] = timestamp;
      r["data"] = new Array();
    }
    var station = doc.station;
    var departures = new Array();
    var cra
    Object.keys(doc.results.lines).forEach(function(k) {
      var trains = new Array();
      doc.results.lines[k].forEach(function(v) {
        var delay = getDelayMinutes(
          v.departureTimeEstimated,
          v.departureTimePlanned);
        trains.push({
          delay: delay,
          scheduled: v.departureTimePlanned,
          crawledTimestamp: doc.timestamp,
          docId: doc._id
        })
      });
      departures.push({
        line: k,
        trains: trains
      });
      merge(r["stats"]["crawledTimestamps"], getKeys(trains, "crawledTimestamp"));
      merge(r["stats"]["docIds"], getKeys(trains, "docId"));
    });
    r["data"].push({
      station: station,
      departures: departures
    });
    var stationCount = r["data"].length;
    r["stats"]["count"] = stationCount;
    r["stats"]["stations"] = getKeys(r["data"], "station");
    if (newEntry) {
      result.push(r);
    }
  });
  return result;
}

function findEntryByTimestamp(array, timestamp) {
  for (var i = 0; i < array.length; i++) {
    if (array[i]["timestamp"] == timestamp) {
      return array[i];
    }
  }
  return {};
}

function getDelayMinutes(estDate, plannedDate) {
  var diff = Math.abs(Date.parse(estDate) - Date.parse(plannedDate));
  return Math.floor(diff / (1000 * 60));
}

function getKeys(data, key) {
  var keys = new Array();
  data.forEach(function(elem) {
    if (!keys.includes(elem[key])) {
      keys.push(elem[key]);
    }
  });
  return keys.sort(function(a, b) {
    return a - b;
  });
}

function merge(array1, array2) {
  array2.forEach(function(element) {
    if (!array1.includes(element)) {
      array1.push(element);
    }
  })
};
