define([
    'angular'
  , './controllers/index'
  , './services/index'
  ]
, function(ng) {
    return ng.module('app', [
      'ngRoute'
    , 'app.controllers'
    , 'app.services'
    ])
  }
)
