var util = require('util')

var ldap = require('ldapjs')
var Promise = require('bluebird')

function InvalidCredentialsError(user) {
  Error.call(this, util.format('Invalid credentials for user "%s"', user))
  this.name = 'InvalidCredentialsError'
  this.user = user
  Error.captureStackTrace(this, InvalidCredentialsError)
}

util.inherits(InvalidCredentialsError, Error)

// Export
module.exports.InvalidCredentialsError = InvalidCredentialsError

// Export
module.exports.login = function(options, username, password) {
  function tryConnect() {
    var resolver = Promise.defer()
    var client = ldap.createClient({
          url: options.url
        , timeout: options.timeout
        , maxConnections: 1
        })

    if (options.bind.dn) {
      client.bind(options.bind.dn, options.bind.credentials, function(err) {
        if (err) {
          resolver.reject(err)
        }
        else {
          resolver.resolve(client)
        }
      })
    }
    else {
      resolver.resolve(client)
    }

    return resolver.promise
  }

  function tryFind(client) {
    var resolver = Promise.defer()
    var query = {
          scope: options.search.scope
        , filter: new ldap.AndFilter({
            filters: [
              new ldap.EqualityFilter({
                attribute: 'objectClass'
              , value: options.search.objectClass
              })
            , new ldap.EqualityFilter({
                attribute: options.search.field
              , value: username
              })
            ]
          })
        }

    client.search(options.search.dn, query, function(err, search) {
      if (err) {
        return resolver.reject(err)
      }

      function entryListener(entry) {
        resolver.resolve(entry)
      }

      function endListener() {
        resolver.reject(new InvalidCredentialsError(username))
      }

      function errorListener(err) {
        resolver.reject(err)
      }

      search.on('searchEntry', entryListener)
      search.on('end', endListener)
      search.on('error', errorListener)

      resolver.promise.finally(function() {
        search.removeListener('searchEntry', entryListener)
        search.removeListener('end', endListener)
        search.removeListener('error', errorListener)
      })
    })

    return resolver.promise
  }

  function tryBind(client, entry) {
    return new Promise(function(resolve, reject) {
      client.bind(entry.object.dn, password, function(err) {
        if (err) {
          reject(new InvalidCredentialsError(username))
        }
        else {
          resolve(entry.object)
        }
      })
    })
  }

  return tryConnect().then(function(client) {
    return tryFind(client)
      .then(function(entry) {
        return tryBind(client, entry)
      })
      .finally(function() {
        client.unbind()
      })
  })
}

// Export
module.exports.email = function(user) {
  return user.mail || user.email || user.userPrincipalName
}
