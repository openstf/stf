var Promise = require("bluebird");

var logger = require("../../util/logger");
var wire = require("../../wire");
var wirerouter = require("../../wire/router");
var db = require("../../db");
var dbapi = require("../../db/api");
var lifecycle = require("../../util/lifecycle");
var srv = require("../../util/srv");
var zmqutil = require("../../util/zmqutil");

var serialLeaseMap = {}
var defaultIntervalMinutes = 5

var updateDeviceLastSeen = function(leaseId, serial) {
  if (serialLeaseMap[serial]) {
    dbapi.markEndOfDeviceUsage(serialLeaseMap[serial], new Date());
    // schedule next update
    setTimeout(function() {
      updateDeviceLastSeen(leaseId, serial);
    }, defaultIntervalMinutes * 60 * 1000);
  }
};

module.exports = db.ensureConnectivity(function(options) {
  console.log(options);
  var log = logger.createLogger("stats");

  // Device side
  var devDealer = zmqutil.socket("dealer");

  Promise.map(options.endpoints.devDealer, function(endpoint) {
    return srv.resolve(endpoint).then(function(records) {
      return srv.attempt(records, function(record) {
        log.info('Device dealer connected to "%s"', record.url);
        devDealer.connect(record.url);
        return Promise.resolve(true);
      });
    });
  }).catch(function(err) {
    log.fatal("Unable to connect to dev dealer endpoint", err);
    lifecycle.fatal();
  });

  devDealer.on(
    "message",
    wirerouter()
      .on(wire.JoinGroupMessage, function(channel, message, data) {
        var serial = message.serial;
        log.info("updateDeviceUsage on JoinGroupMessage, serial:", serial);
        dbapi.loadDevice(serial).then(function(device) {
          serialLeaseMap[options.serial] = uuid.v4();
          var startAt = new Date();
          var defaultEndsAt = new Date(
            startAt.getTime() + defaultIntervalMinutes * 60 * 1000
          );
          log.info("Created new lease id", serialLeaseMap[serial]);
          dbapi.markStartOfDeviceUsage(
            serialLeaseMap[serial],
            currentGroup,
            device,
            startAt,
            defaultEndsAt
          );

          // update every x minutes
          setTimeout(function() {
            updateDeviceLastSeen(serialLeaseMap[serial], serial);
          }, defaultIntervalMinutes * 60 * 1000);
        });
      })
      .on(wire.LeaveGroupMessage, function(channel, message, data) {
        var serial = message.serial;
        log.info("updateDeviceUsage on LeaveGroupMessage, serial:", serial);
        if (serialLeaseMap[serial]) {
          dbapi.markEndOfDeviceUsage(serialLeaseMap[serial], new Date());
          delete serialLeaseMap[serial];
        } else {
          log.info("Cannot found previous usage for device serial", serial);
        }
      })
      .handler()
  );

  lifecycle.observe(function() {
    [devDealer].forEach(function(sock) {
      try {
        sock.close();
      } catch (err) {
        // No-op
      }
    });
  });
});
