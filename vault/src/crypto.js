var Unibabel = require('unibabel').Unibabel

exports.decryptSymmetricWith = decryptSymmetricWith

function decryptSymmetricWith (cryptoKey) {
  return function (encryptedValue) {
    var bytes
    try {
      bytes = Unibabel.base64ToArr(encryptedValue)
    } catch (err) {
      return Promise.reject(err)
    }
    return window.crypto.subtle.decrypt(
      {
        name: 'AES-CTR',
        counter: new Uint8Array(16),
        length: 128
      },
      cryptoKey,
      bytes
    )
      .then(parseDecrypted)
  }
}

exports.encryptSymmetricWith = encryptSymmetricWith

function encryptSymmetricWith (cryptoKey) {
  return function (unencryptedValue) {
    var bytes
    try {
      bytes = Unibabel.utf8ToBuffer(JSON.stringify(unencryptedValue))
    } catch (err) {
      return Promise.reject(err)
    }
    return window.crypto.subtle.encrypt(
      {
        name: 'AES-CTR',
        counter: new Uint8Array(16),
        length: 128
      },
      cryptoKey,
      bytes
    )
      .then(encodeEncrypted)
  }
}

exports.decryptAsymmetricWith = decryptAsymmetricWith

function decryptAsymmetricWith (privateCryptoKey) {
  return function (encryptedValue) {
    var bytes
    try {
      bytes = Unibabel.base64ToArr(encryptedValue)
    } catch (err) {
      return Promise.reject(err)
    }
    return window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateCryptoKey,
      bytes
    )
      .then(parseDecrypted)
  }
}

exports.encryptAsymmetricWith = encryptAsymmetricWith

function encryptAsymmetricWith (publicCryptoKey) {
  return function (unencryptedValue) {
    var bytes
    try {
      bytes = Unibabel.utf8ToBuffer(JSON.stringify(unencryptedValue))
    } catch (err) {
      return Promise.reject(err)
    }
    return window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicCryptoKey,
      bytes
    )
      .then(encodeEncrypted)
  }
}

exports.importPrivateKey = importPrivateKey

function importPrivateKey (privateJWK) {
  return window.crypto.subtle.importKey(
    'jwk',
    privateJWK,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' }
    },
    false,
    ['decrypt']
  )
}

exports.importPublicKey = importPublicKey

function importPublicKey (publicJWK) {
  return window.crypto.subtle.importKey(
    'jwk',
    publicJWK,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' }
    },
    false,
    ['encrypt']
  )
}

exports.importSymmetricKey = importSymmetricKey

function importSymmetricKey (symmetricJWK) {
  return window.crypto.subtle.importKey(
    'jwk',
    symmetricJWK,
    {
      name: 'AES-CTR'
    },
    false,
    ['encrypt', 'decrypt']
  )
}

exports.createSymmetricKey = createSymmetricKey

function createSymmetricKey () {
  return window.crypto.subtle.generateKey(
    {
      name: 'AES-CTR',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  )
}

exports.exportKey = exportKey

function exportKey (key) {
  return window.crypto.subtle.exportKey('jwk', key)
}

function parseDecrypted (decrypted) {
  var payloadAsString = Unibabel.utf8ArrToStr(new Uint8Array(decrypted))
  return JSON.parse(payloadAsString)
}

function encodeEncrypted (encrypted) {
  return Unibabel.arrToBase64(new Uint8Array(encrypted))
}
