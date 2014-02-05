define([
    'angular'
  , './controllers/_index'
  , './services/_index'
  ]
, function(ng) {
    return ng.module('app', [
      'ngRoute'
    , 'app.controllers'
    , 'app.services'
    ])
  }
)
