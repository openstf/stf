module.exports.list = function(val) {
  return val.split(/\s*,\s*/g).filter(Boolean)
}

module.exports.allUnknownArgs = function(args) {
  return [].slice.call(args, 0, -1).filter(Boolean)
}

module.exports.lastArg = function(args) {
  return args[args.length - 1]
}
