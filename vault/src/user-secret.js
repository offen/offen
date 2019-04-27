const Dexie = require('dexie')

module.exports = ensureUserSecret

function ensureUserSecret (accountId, host) {
  const db = new Dexie('user_secrets')
  db.version(1).stores({
    secrets: 'accountId,userSecret'
  })
  return db.secrets.get({ accountId: accountId })
    .then(function (result) {
      if (!result) {
        return exchangeUserSecret(accountId, host)
          .then(function (userSecret) {
            return db.secrets.put({
              accountId: accountId,
              userSecret: userSecret
            })
          })
      }
      return result.userSecret
    })
}

function exchangeUserSecret (accountId, host) {
  return window
    .fetch(`${host}/exchange?account_id=${accountId}`, {
      credentials: 'include'
    })
    .then(function (r) {
      return r.json()
    })
    .then(function (response) {
      return generateNewUserSecret(response.public_key)
    })
    .then((result) => {
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
            const err = new Error(
              'Request failed with status code ' + response.status
            )
            err.status = response.status
            throw err
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
    .then(([accountPublicKey, userSecret]) => {
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
          const asString = byteArrayToString(encrypted)
          return {
            encryptedUserSecret: window.btoa(asString),
            userSecret: userSecret
          }
        })
    })
}

function byteArrayToString (byteArray) {
  return Array.from(new Uint8Array(byteArray))
    .map((byte) => String.fromCharCode(byte)).join('')
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
