var handleFetchResponse = require('offen/fetch-response')

var getDatabase = require('./database')
var crypto = require('./crypto')

module.exports = ensureUserSecret

// ensureUserSecret looks up the UserSecret for the given accountId. In case it
// is not present in the local database or `flush` is passed, it initiates a
// new exchange of secrets and stores the result in the local database.
function ensureUserSecret (accountId, host, flush) {
  var db = getDatabase()

  var prep = Promise.resolve()
  if (flush) {
    prep = db.secrets.delete(accountId)
  }

  return prep.then(function () {
    return db.secrets.get({ accountId: accountId })
      .then(function (result) {
        if (result) {
          return result.userSecret
        }
        return exchangeUserSecret(accountId, host)
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

function exchangeUserSecret (accountId, host) {
  return window
    .fetch(`${host}/exchange?account_id=${accountId}`, {
      credentials: 'include'
    })
    .then(handleFetchResponse)
    .then(function (body) {
      return generateNewUserSecret(body.public_key)
    })
    .then(function (result) {
      return window
        .fetch(`${host}/exchange`, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            account_id: accountId,
            encrypted_user_secret: result.encryptedUserSecret
          })
        })
        .then(handleFetchResponse)
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
