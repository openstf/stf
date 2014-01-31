require.config({
  paths: {
    'angular': '../lib/angular/angular'
  , 'angular-route': '../lib/angular-route/angular-route'
  , 'socket.io': '../lib/socket.io-client/dist/socket.io'
  , 'oboe': '../lib/oboe/dist/oboe-browser'
  , 'lodash': '../lib/lodash/dist/lodash'
  }
, shim: {
    'angular': {
      exports: 'angular'
    }
  , 'angular-route': {
      deps: [
        'angular'
      ]
    }
  }
, deps: [
    './bootstrap'
  ]
})
