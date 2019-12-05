var Unibabel = require('unibabel').Unibabel
var jwkToPem = require('jwk-to-pem')
var forge = require('node-forge')
forge.options.usePureJavaScript = true

var cipher = require('./versioned-cipher')

var SYMMETRIC_ALGO_AESGCM = 1
var ASSYMMETRIC_ALGO_RSA_OAEP = 1

exports._impl = 'forge'

exports.decryptSymmetricWith = decryptSymmetricWith

function decryptSymmetricWith (jwk) {
  return asyncify(function (encryptedValue) {
    var keyBytes = importSymmetricKey(jwk)
    var chunks = cipher.deserialize(encryptedValue)
    if (chunks.error) {
      return Promise.reject(chunks.error)
    }
    switch (chunks.algoVersion) {
      case SYMMETRIC_ALGO_AESGCM: {
        // web crypto simply appends the authentication tag to the ciphertext
        // so this is what we are doing here as well
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
        throw new Error('Unable to finish decipher.')
      }
      default:
        throw new Error('Unknown symmetric algo version "' + chunks.algoVersion + '"')
    }
  })
}

exports.encryptSymmetricWith = encryptSymmetricWith

function encryptSymmetricWith (jwk) {
  return function (unencryptedValue) {
    var keyBytes = importSymmetricKey(jwk)
    return randomBytes(12)
      .then(function (nonce) {
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
          return result
        }
        throw new Error('Unable to finish encryption.')
      })
  }
}

exports.decryptAsymmetricWith = decryptAsymmetricWith

function decryptAsymmetricWith (privateJwk) {
  return asyncify(function (encryptedValue) {
    var privatePEM = importPrivateKey(privateJwk)
    var privateKey = forge.pki.privateKeyFromPem(privatePEM)
    var chunks = cipher.deserialize(encryptedValue)
    if (chunks.error) {
      throw chunks.error
    }
    switch (chunks.algoVersion) {
      case ASSYMMETRIC_ALGO_RSA_OAEP: {
        var data = privateKey.decrypt(chunks.cipher, 'RSA-OAEP', {
          md: forge.md.sha256.create()
        })
        return JSON.parse(data)
      }
      default:
        throw new Error('Unknown asymmetric algo version "' + chunks.algoVersion + '"')
    }
  })
}

exports.encryptAsymmetricWith = encryptAsymmetricWith

function encryptAsymmetricWith (publicJwk) {
  return asyncify(function (unencryptedValue) {
    var publicPEM = importPublicKey(publicJwk)
    var publicKey = forge.pki.publicKeyFromPem(publicPEM)
    var enc = publicKey.encrypt(JSON.stringify(unencryptedValue), 'RSA-OAEP', {
      md: forge.md.sha256.create()
    })
    var result = cipher.serialize(
      Unibabel.binaryStringToBuffer(enc), null, ASSYMMETRIC_ALGO_RSA_OAEP
    )
    return result
  })
}

exports.createSymmetricKey = createSymmetricKey

function createSymmetricKey () {
  return randomBytes(16)
    .then(function (bytes) {
      return {
        kty: 'oct',
        k: base64encodeKey(bytes)
      }
    })
}

function randomBytes (num) {
  return new Promise(function (resolve, reject) {
    forge.random.getBytes(16, function (err, bytes) {
      if (err) {
        return reject(err)
      }
      resolve(bytes)
    })
  })
}

function importPrivateKey (jwk) {
  return jwkToPem(jwk, { private: true })
}

function importPublicKey (jwk) {
  return jwkToPem(jwk)
}

function importSymmetricKey (jwk) {
  if (jwk.kty !== 'oct' || !jwk.k) {
    throw new Error(
      'Received malformed JWK, expected `k` and `kty` values to be present.'
    )
  }
  return base64decodeKey(jwk.k)
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

function asyncify (fn) {
  return function () {
    var args = [].slice.call(arguments)
    return Promise.resolve().then(function () {
      return fn.apply(null, args)
    })
  }
}
