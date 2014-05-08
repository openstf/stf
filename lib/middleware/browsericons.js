var express = require('express')

var pathutil = require('../util/pathutil')

module.exports = function(options) {
  return express.static(
    pathutil.root('node_modules/stf-browser-db/dist'))
}
