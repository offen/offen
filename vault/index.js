const accountId = '78403940-ae4f-4aff-a395-1e90f145cf62'

window
  .fetch(`http://localhost:8080/exchange?account_id=${accountId}`, {
    credentials: 'include'
  })
  .then(function (r) {
    return r.json()
  })
  .then(function (response) {
    return generateNewUserSecret(response.public_key)
  })
  .then((encryptedUserSecret) => {
    return window.fetch('http://localhost:8080/exchange', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        account_id: accountId,
        encrypted_user_secret: encryptedUserSecret
      })
    })
  })
  .then(function (response) {
    console.log(response)
  })
  .catch(function (err) {
    console.error(err)
  })

function generateNewUserSecret (publicWebKey) {
  return Promise
    .all([
      decodePublicWebKey(publicWebKey),
      createUserSecret()
    ])
    .then(([accountPublicKey, userSecretKey]) => {
      return window.crypto.subtle
        .exportKey(
          'jwk',
          userSecretKey
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
          return window.btoa(asString)
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
