var getDatabase = require('./database')
var crypto = require('./crypto')
var api = require('./api')

module.exports = ensureUserSecretWith(api)
module.exports.ensureUserSecretWith = ensureUserSecretWith

// ensureUserSecret looks up the UserSecret for the given accountId. In case it
// is not present in the local database or `flush` is passed, it initiates a
// new exchange of secrets and stores the result in the local database.
function ensureUserSecretWith (api) {
  return function (accountId, flush) {
    var db = getDatabase()

    var before = Promise.resolve()
    if (flush) {
      before = db.secrets.delete(accountId)
    }

    return before.then(function () {
      return db.secrets.get({ accountId: accountId })
        .then(function (result) {
          if (result) {
            return result.userSecret
          }
          return exchangeUserSecret(api, accountId)
            .then(function (userSecret) {
              return db.secrets
                .put({
                  accountId: accountId,
                  userSecret: userSecret
                })
                .then(function () {
                  return userSecret
                })
            })
        })
    })
  }
}
function exchangeUserSecret (api, accountId) {
  return api.getPublicKey(accountId)
    .then(function (body) {
      return generateNewUserSecret(body.public_key)
    })
    .then(function (result) {
      var body = {
        account_id: accountId,
        encrypted_user_secret: result.encryptedUserSecret
      }
      return api.postUserSecret(body)
        .then(function () {
          return result.userSecret
        })
    })
}

function generateNewUserSecret (publicJWK) {
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
}
