/**
* Copyright © 2019 contains code contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

var r = require('rethinkdb')

module.exports = {
  users: {
    primaryKey: 'email'
  , indexes: {
      adbKeys: {
        indexFunction: function(user) {
          return user('adbKeys')('fingerprint')
        }
      , options: {
          multi: true
        }
      }
    }
  }
, accessTokens: {
    primaryKey: 'id'
  , indexes: {
      email: null
    }
  }
, vncauth: {
    primaryKey: 'password'
  , indexes: {
      response: null
    , responsePerDevice: {
        indexFunction: function(row) {
          return [row('response'), row('deviceId')]
        }
      }
    }
  }
, devices: {
    primaryKey: 'serial'
  , indexes: {
      owner: {
        indexFunction: function(device) {
          return r.branch(
            device('present')
          , device('owner')('email')
          , r.literal()
          )
        }
      }
    , present: null
    , providerChannel: {
        indexFunction: function(device) {
          return device('provider')('channel')
        }
      }
    , group: {
        indexFunction: function(device) {
          return device('group')('id')
        }
      }
    }
  }
, logs: {
    primaryKey: 'id'
  }
, groups: {
    primaryKey: 'id'
  , indexes: {
        privilege: null
      , owner: {
          indexFunction: function(group) {
            return group('owner')('email')
          }
        }
      , startTime: {
          indexFunction: function(group) {
            return group('dates').nth(0)('start')
          }
        }
    }
  }
}
