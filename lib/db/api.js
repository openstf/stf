var r = require('rethinkdb')

var db = require('./')

module.exports.saveUserAfterLogin = function(user) {
  return db.run(r.table('users').insert({
      email: user.email
    , name: user.name
    , lastLogin: r.now()
    }
  , {
      upsert: true
    }))
}
