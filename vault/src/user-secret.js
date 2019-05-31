var Unibabel = require('unibabel').Unibabel
var handleFetchResponse = require('offen/fetch-response')

var getDatabase = require('./database')

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

function generateNewUserSecret (publicWebKey) {
  return Promise
    .all([
      decodePublicWebKey(publicWebKey),
      createUserSecret()
    ])
    .then(function (keys) {
      var accountPublicKey = keys[0]
      var userSecret = keys[1]
      return window.crypto.subtle
        .exportKey(
          'jwk',
          userSecret
        )
        .then(function (keydata) {
          var enc = new TextEncoder()
          return window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            accountPublicKey,
            enc.encode(JSON.stringify(keydata))
          )
        })
        .then(function (encrypted) {
          return {
            encryptedUserSecret: Unibabel.arrToBase64(new Uint8Array(encrypted)),
            userSecret: userSecret
          }
        })
    })
}

function decodePublicWebKey (publicWebKey) {
  return window.crypto.subtle.importKey(
    'jwk',
    publicWebKey,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' }
    },
    false,
    ['encrypt']
  )
}

function createUserSecret () {
  return window.crypto.subtle.generateKey({
    name: 'AES-CTR',
    length: 256
  }, true, ['encrypt', 'decrypt'])
}
