define([
    'angular'
  , './controllers/index'
  ]
, function(ng) {
    return ng.module('app', [
      'ngRoute'
    , 'app.controllers'
    ])
  }
)
