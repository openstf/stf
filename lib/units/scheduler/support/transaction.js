var crypto = require('crypto')

var Promise = require('bluebird')
var uuid = require('node-uuid')

function makeChannelId() {
  var id = uuid.v4()
  var hash = crypto.createHash('sha1')
  hash.update(id)
  return hash.digest('base64')
}

function Transaction (options) {
  if (!(this instanceof Transaction)) {
    return new Transaction(options)
  }
  var self = this

  this.sub = options.sub
  this.channel = options.channel || makeChannelId()
  this.promise = new Promise(function(resolve) {
    self.sub.subscribe(self.channel)
    self.sub.on('message', function(resChannel, data) {
      if (self.channel == resChannel) {
        self.sub.unsubscribe(self.channel)
        resolve(data)
      }
    })
  })
}

module.exports = Transaction
