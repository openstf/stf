var net = require('net')
var VncServer = require('./server')

var nserv = net.createServer({
  allowHalfOpen: true
})

var vserv = new VncServer(nserv)

nserv.listen(5910)
