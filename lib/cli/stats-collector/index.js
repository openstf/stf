module.exports.command = "stats-collector";

module.exports.describe = "Start a device usage stats collector unit.";

module.exports.builder = function(yargs) {
  var os = require("os");

  return yargs
    .env("STF_STATS_COLLECTOR")
    .strict()
    .option("connect-dev-dealer", {
      alias: "d",
      describe: "Device-side ZeroMQ DEALER endpoint to connect to.",
      array: true,
      demand: true
    })
    .epilog(
      "Each option can be be overwritten with an environment variable " +
        "by converting the option to uppercase, replacing dashes with " +
        "underscores and prefixing it with `STF_STATS_COLLECTOR_` (e.g. " +
        "`STF_STATS_COLLECTOR_CONNECT_DEV_DEALER`)."
    );
};

module.exports.handler = function(argv) {
  return require("../../units/stats-collector")({
    endpoints: {
      devDealer: argv.connectDevDealer
    }
  });
};
