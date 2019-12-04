var Unibabel = require('unibabel').Unibabel
var jwkToPem = require('jwk-to-pem')
var forge = require('node-forge')
forge.options.usePureJavaScript = true

var cipher = require('./versioned-cipher')

var SYMMETRIC_ALGO_AESGCM = 1
var ASSYMMETRIC_ALGO_RSA_OAEP = 1

exports.decryptSymmetricWith = decryptSymmetricWith

function decryptSymmetricWith (jwk) {
  return function (encryptedValue) {
    return importSymmetricKey(jwk)
      .then(function (keyBytes) {
        var chunks = cipher.deserialize(encryptedValue)
        if (chunks.error) {
          return Promise.reject(chunks.error)
        }
        switch (chunks.algoVersion) {
          case SYMMETRIC_ALGO_AESGCM: {
            var tag = chunks.cipher.slice(chunks.cipher.length - 16)
            var body = chunks.cipher.slice(0, chunks.cipher.length - 16)
            var op = forge.cipher.createDecipher('AES-GCM', keyBytes)
            op.start({
              iv: chunks.nonce,
              tagLength: 128,
              tag: forge.util.createBuffer(tag)
            })
            op.update(forge.util.createBuffer(body))
            if (op.finish()) {
              return JSON.parse(op.output.data)
            }
            return Promise.reject(new Error('Unable to finish decipher.'))
          }
          default:
            return Promise.reject(
              new Error('Unknown symmetric algo version "' + chunks.algoVersion + '"')
            )
        }
      })
  }
}

exports.encryptSymmetricWith = encryptSymmetricWith

function encryptSymmetricWith (jwk) {
  return function (unencryptedValue) {
    return importSymmetricKey(jwk)
      .then(function (keyBytes) {
        return new Promise(function (resolve, reject) {
          forge.random.getBytes(12, function (err, nonce) {
            if (err) {
              return reject(err)
            }

            var op = forge.cipher.createCipher('AES-GCM', keyBytes)
            op.start({
              iv: nonce,
              tagLength: 128
            })
            op.update(forge.util.createBuffer(JSON.stringify(unencryptedValue)))
            if (op.finish()) {
              var result = cipher.serialize(
                // web crypto simply appends the authentication tag to the ciphertext
                // so this is what we are doing here as well
                Unibabel.binaryStringToBuffer(op.output.data + op.mode.tag.data),
                Unibabel.binaryStringToBuffer(nonce),
                SYMMETRIC_ALGO_AESGCM
              )
              resolve(result)
              return
            }
            reject(new Error('Unable to finish encrpytion'))
          })
        })
      })
  }
}

exports.decryptAsymmetricWith = decryptAsymmetricWith

function decryptAsymmetricWith (privateJwk) {
  return function (encryptedValue) {
    return importPrivateKey(privateJwk)
      .then(function (privatePEM) {
        var privateKey = forge.pki.privateKeyFromPem(privatePEM)
        var chunks = cipher.deserialize(encryptedValue)
        if (chunks.error) {
          return Promise.reject(chunks.error)
        }
        switch (chunks.algoVersion) {
          case ASSYMMETRIC_ALGO_RSA_OAEP: {
            var result = privateKey.decrypt(chunks.cipher, 'RSA-OAEP', {
              md: forge.md.sha256.create()
            })
            return JSON.parse(result)
          }
          default:
            return Promise.reject(
              new Error('Unknown asymmetric algo version "' + chunks.algoVersion + '"')
            )
        }
      })
  }
}

exports.encryptAsymmetricWith = encryptAsymmetricWith

function encryptAsymmetricWith (publicJwk) {
  return function (unencryptedValue) {
    return importPublicKey(publicJwk)
      .then(function (publicPEM) {
        var publicKey = forge.pki.publicKeyFromPem(publicPEM)
        var enc = publicKey.encrypt(JSON.stringify(unencryptedValue), 'RSA-OAEP', {
          md: forge.md.sha256.create()
        })
        return Unibabel.binaryStringToBuffer(enc)
      })
      .then(function (encryptedValue) {
        return cipher.serialize(encryptedValue, null, ASSYMMETRIC_ALGO_RSA_OAEP)
      })
  }
}

exports.createSymmetricKey = createSymmetricKey

function createSymmetricKey () {
  return new Promise(function (resolve, reject) {
    forge.random.getBytes(16, function (err, bytes) {
      if (err) {
        return reject(err)
      }
      resolve({
        kty: 'oct',
        k: base64encodeKey(bytes)
      })
    })
  })
}

function importPrivateKey (jwk) {
  return Promise.resolve(jwkToPem(jwk, { private: true }))
}

function importPublicKey (jwk) {
  return Promise.resolve(jwkToPem(jwk))
}

function importSymmetricKey (jwk) {
  return new Promise(function (resolve, reject) {
    if (jwk.kty !== 'oct' || !jwk.k) {
      return reject(new Error('Received malformed key'))
    }
    resolve(base64decodeKey(jwk.k))
  })
}

function base64encodeKey (a) {
  return window.btoa(a)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64decodeKey (a) {
  a = a.replace(/-/g, '+')
    .replace(/_/g, '/')
  while (a % 4) {
    a += '='
  }
  return window.atob(a)
}
