var http = require('http')
var urljoin = require('url-join')
var express = require('express')
var validator = require('express-validator')
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var serveStatic = require('serve-static')
var csrf = require('csurf')
var Promise = require('bluebird')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var jwtutil = require('../../util/jwtutil')
var pathutil = require('../../util/pathutil')
var urlutil = require('../../util/urlutil')
var lifecycle = require('../../util/lifecycle')

var openid = require('openid');
var url = require('url');
var querystring = require('querystring');
var extensions = [new openid.SimpleRegistration({   
                    "email" : true, 
                    "fullname" : true,
                  })];



module.exports = function(options) {
  var verifyUrl = urljoin(options.appUrl, "/auth/verify");

  var relyingParty = new openid.RelyingParty(
    verifyUrl,
    null,  // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    extensions);


  var log = logger.createLogger('auth-mock')
    , app = express()
    , server = Promise.promisifyAll(http.createServer(app))

  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  app.get('/', function(req, res) {
    res.redirect('/auth/openid/')
  })

  app.get('/auth/openid/', function(req, res) {
    relyingParty.authenticate(options.identifier, false, function(err, authUrl){
      if (err){
        res.send("authentication failed");
      } else if(!authUrl){
        res.send("authentication failed");
      } else {
        log.info("redirect to authUrl: %s", options.identifier);
        res.redirect(authUrl);
      }
    });
  })

  app.get('/auth/verify', function(req, res){
    var log = logger.createLogger('auth-openid')
    log.setLocalIdentifier(req.ip)

    relyingParty.verifyAssertion(req, function(err, result){
      log.info("openid verify assertion");
      if (err || !result.authenticated) {
        res.send("Auth failed");
        return
      }
      var email = req.query['openid.sreg.email'];
      var name = req.query['openid.sreg.fullname'];
      log.info('Authenticated "%s:%s"', name, email)
      var token = jwtutil.encode({
        payload: {
          email: email
        , name: name
        }
        , secret: options.secret
      })
      res.redirect(urlutil.addParams(options.appUrl, {jwt: token}));
    })
  });

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
