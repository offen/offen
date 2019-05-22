const Unibabel = require('unibabel').Unibabel

const getDatabase = require('./database')

module.exports = ensureUserSecret

function ensureUserSecret (accountId, host, flush) {
  const db = getDatabase()

  let prep = Promise.resolve()
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
    .then(function (response) {
      if (response.status >= 400) {
        return response.json().then(function (errorBody) {
          const err = new Error(errorBody.error)
          err.status = response.status
          throw err
        })
      }
      return response.json()
    })
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
        .then(function (response) {
          if (response.status >= 400) {
            return response.json().then(function (errorBody) {
              const err = new Error(errorBody.error)
              err.status = response.status
              throw err
            })
          }
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
      const accountPublicKey = keys[0]
      const userSecret = keys[1]
      return window.crypto.subtle
        .exportKey(
          'jwk',
          userSecret
        )
        .then(function (keydata) {
          const enc = new TextEncoder()
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
