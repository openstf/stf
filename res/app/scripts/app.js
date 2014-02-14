require('angular')

var routes = require('./routes')
var controllers = require('./controllers')
var services = require('./services')

var app = angular.module('app', [
  'ngRoute',
  'app.controllers',
  'app.services'
])
  .config(routes)


module.exports = app
