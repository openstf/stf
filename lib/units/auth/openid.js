var http = require('http')

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
  var verifyUrl = options.appUrl + "/verify";
  // var verifyUrl = 'http://'+options.hostname+'/verify';
  console.log(verifyUrl);

  var relyingParty = new openid.RelyingParty(
    verifyUrl,
    null,  // Realm (optional, specifies realm for OpenID authentication)
    false, // Use stateless verification
    false, // Strict mode
    extensions);


  var log = logger.createLogger('auth-mock')
    , app = express()
    , server = Promise.promisifyAll(http.createServer(app))

  // lifecycle.observe(function() {
  //   log.info('Waiting for client connections to end')
  //   return server.closeAsync()
  //     .catch(function() {
  //       // Okay
  //     })
  // })

  app.set('view engine', 'jade')
  app.set('views', pathutil.resource('auth/mock/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  // app.use(cookieSession({
  //   name: options.ssid
  // , keys: [options.secret]
  // }))
  // app.use(bodyParser.json())
  // app.use(csrf())
  // app.use(validator())
  // app.use('/static/bower_components',
  //   serveStatic(pathutil.resource('bower_components')))
  // app.use('/static/auth/mock', serveStatic(pathutil.resource('auth/mock')))

  // app.use(function(req, res, next) {
  //   res.cookie('XSRF-TOKEN', req.csrfToken());
  //   next()
  // })

  app.get('/', function(req, res) {
    console.log(req.get('host'));
    res.redirect('/auth/openid/')
  })

  app.get('/auth/openid/', function(req, res) {
    
    relyingParty.authenticate(options.identifier, false, function(err, authUrl){
      if (err){
        res.send("authentication failed");
      } else if(!authUrl){
        res.send("authentication failed");
      } else {
        res.redirect(authUrl);
      }
    });
  })

  app.get('/verify', function(req, res){
    var relyingParty = new openid.RelyingParty();
    relyingParty.verifyAssertion(req, function(err, result){
      if (err || !result.authenticated) {
        res.send("Auth failed");
      } else {
        console.log(result);
        var email = req.query['openid.sreg.email'];
        var name = req.query['openid.sreg.fullname'];
        // console.log(email, name);
        log.info('Authenticated "%s:%s"', name, email)
        var token = jwtutil.encode({
          payload: {
            email: email
          , name: name
          }
        , secret: options.secret
        })
        res.status(200)
          .json({
            success: true
          , redirect: urlutil.addParams(options.appUrl, {
              jwt: token
            })
          })
      }
    })
  });
  // app.post('/auth/api/v1/mock', function(req, res) {
  //   var log = logger.createLogger('auth-mock')
  //   log.setLocalIdentifier(req.ip)
  //   switch (req.accepts(['json'])) {
  //     case 'json':
  //       requtil.validate(req, function() {
  //           req.checkBody('name').notEmpty()
  //           req.checkBody('email').isEmail()
  //         })
  //         .then(function() {
  //           log.info('Authenticated "%s"', req.body.email)
  //           var token = jwtutil.encode({
  //             payload: {
  //               email: req.body.email
  //             , name: req.body.name
  //             }
  //           , secret: options.secret
  //           })
  //           res.status(200)
  //             .json({
  //               success: true
  //             , redirect: urlutil.addParams(options.appUrl, {
  //                 jwt: token
  //               })
  //             })
  //         })
  //         .catch(requtil.ValidationError, function(err) {
  //           res.status(400)
  //             .json({
  //               success: false
  //             , error: 'ValidationError'
  //             , validationErrors: err.errors
  //             })
  //         })
  //         .catch(function(err) {
  //           log.error('Unexpected error', err.stack)
  //           res.status(500)
  //             .json({
  //               success: false
  //             , error: 'ServerError'
  //             })
  //         })
  //       break
  //     default:
  //       res.send(406)
  //       break
  //   }
  // })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
