var proxyaddr = require('proxy-addr')

module.exports = function(options) {
  return function(socket, next) {
    var req = socket.request
    req.ip = proxyaddr(req, options.trust)
    next()
  }
}
