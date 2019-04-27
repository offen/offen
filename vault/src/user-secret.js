const Dexie = require('dexie')

module.exports = ensureUserSecret

function ensureUserSecret (accountId, host) {
  const db = getDatabase()
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
            encryptedUserSecret: arrayBufferToBase64(encrypted),
            userSecret: userSecret
          }
        })
    })
}

function arrayBufferToBase64 (byteArray) {
  const chars = Array.from(new Uint8Array(byteArray))
    .map(function (byte) {
      return String.fromCharCode(byte)
    })
  return window.btoa(chars.join(''))
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

function getDatabase () {
  getDatabase.db = getDatabase.db || createDatabase()
  return getDatabase.db
}

function createDatabase () {
  const db = new Dexie('user_secrets')
  db.version(1).stores({
    secrets: 'accountId'
  })
  return db
}
