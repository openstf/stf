var util = require('util')

function Resource(options) {
  this.src = options.src
  this.dest = options.dest.shift()
  this.comm = options.comm
  this.mode = options.mode
  this.fallback = options.dest
}

Resource.prototype.shift = function() {
  if (this.fallback.length === 0) {
    throw new Error(util.format(
      'Out of fallback locations for "%s"'
    , this.src
    ))
  }
  this.dest = this.fallback.shift()
}

module.exports = Resource
