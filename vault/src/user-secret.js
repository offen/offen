var bindCrypto = require('./bind-crypto')
var api = require('./api')
var queries = require('./queries')

module.exports = ensureUserSecretWith(api, queries)
module.exports.ensureUserSecretWith = ensureUserSecretWith

// ensureUserSecret looks up the UserSecret for the given accountId. In case it
// is not present in the local database or `flush` is passed, it initiates a
// new exchange of secrets and stores the result in the local database.
function ensureUserSecretWith (api, queries) {
  return function (accountId, flush) {
    var before = Promise.resolve()
    if (flush) {
      before = queries.deleteUserSecret(accountId)
    }

    return before
      .then(function () {
        return queries.getUserSecret(accountId)
      })
      .then(function (userSecret) {
        if (userSecret) {
          return userSecret
        }
        return exchangeUserSecret(api, accountId)
          .then(function (createdUserSecret) {
            userSecret = createdUserSecret
            return queries.putUserSecret(accountId, userSecret)
          })
          .then(function () {
            return userSecret
          })
      })
  }
}

var generateNewUserSecret = bindCrypto(function (publicJWK) {
  var crypto = this
  return Promise
    .all([
      crypto.importPublicKey(publicJWK),
      crypto.createSymmetricKey()
    ])
    .then(function (keys) {
      var publicKey = keys[0]
      var userSecret = keys[1]

      return crypto.exportKey(userSecret)
        .then(crypto.encryptAsymmetricWith(publicKey))
        .then(function (encryptedUserSecret) {
          return {
            encryptedUserSecret: encryptedUserSecret,
            userSecret: userSecret
          }
        })
    })
})

function exchangeUserSecret (api, accountId) {
  return api.getPublicKey(accountId)
    .then(generateNewUserSecret)
    .then(function (result) {
      var body = {
        accountId: accountId,
        encryptedUserSecret: result.encryptedUserSecret
      }
      return api.postUserSecret(body)
        .then(function () {
          return result.userSecret
        })
    })
}
