/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const Unibabel = require('unibabel').Unibabel
const jwkToPem = require('jwk-to-pem')
const forge = require('node-forge')
forge.options.usePureJavaScript = true

const cipher = require('./versioned-cipher')
const compression = require('./compression')

const SYMMETRIC_ALGO_AESGCM = 1
const ASYMMETRIC_ALGO_RSA_OAEP = 1

exports._impl = 'forge'

exports.decryptSymmetricWith = decryptSymmetricWith

function decryptSymmetricWith (jwk, deserializer) {
  deserializer = deserializer || JSON.parse
  const keyBytes = importSymmetricKey(jwk)
  return asyncify(function (encryptedValue, inflate) {
    const chunks = cipher.deserialize(encryptedValue)
    if (chunks.error) {
      return Promise.reject(chunks.error)
    }
    switch (chunks.algoVersion) {
      case SYMMETRIC_ALGO_AESGCM: {
        // web crypto simply appends the authentication tag to the ciphertext
        // so this is what we are doing here as well
        const tag = chunks.cipher.slice(chunks.cipher.length - 16)
        const body = chunks.cipher.slice(0, chunks.cipher.length - 16)
        const op = forge.cipher.createDecipher('AES-GCM', keyBytes)
        op.start({
          iv: chunks.nonce,
          tagLength: 128,
          tag: forge.util.createBuffer(tag)
        })
        op.update(forge.util.createBuffer(body))
        if (op.finish()) {
          if (inflate) {
            return compression.decompress(Unibabel.binaryStringToBuffer(op.output.getBytes()))
              .then(function (serializedString) {
                return deserializer(serializedString)
              })
          } else {
            return deserializer(forge.util.decodeUtf8(op.output.data))
          }
        }
        throw new Error('Unable to finish decipher.')
      }
      default:
        throw new Error('Unknown symmetric algo version "' + chunks.algoVersion + '"')
    }
  })
}

exports.encryptSymmetricWith = encryptSymmetricWith

function encryptSymmetricWith (jwk, serializer) {
  serializer = serializer || JSON.stringify
  const keyBytes = importSymmetricKey(jwk)
  return function (unencryptedValue, deflate) {
    return randomBytes(12)
      .then(function (nonce) {
        const op = forge.cipher.createCipher('AES-GCM', keyBytes)
        op.start({
          iv: nonce,
          tagLength: 128
        })
        const serializedString = serializer(unencryptedValue)
        const bytes = deflate
          ? compression.compress(serializedString)
          : Promise.resolve(forge.util.encodeUtf8(serializedString))

        return bytes
          .then(function (buffer) {
            op.update(forge.util.createBuffer(buffer))
            if (op.finish()) {
              const result = cipher.serialize(
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
      })
  }
}

exports.decryptAsymmetricWith = decryptAsymmetricWith

function decryptAsymmetricWith (privateJwk, deserializer) {
  deserializer = deserializer || JSON.parse
  const privatePEM = importPrivateKey(privateJwk)
  const privateKey = forge.pki.privateKeyFromPem(privatePEM)
  return asyncify(function (encryptedValue) {
    const chunks = cipher.deserialize(encryptedValue)
    if (chunks.error) {
      throw chunks.error
    }
    switch (chunks.algoVersion) {
      case ASYMMETRIC_ALGO_RSA_OAEP: {
        const data = privateKey.decrypt(chunks.cipher, 'RSA-OAEP', {
          md: forge.md.sha256.create()
        })
        return deserializer(forge.util.decodeUtf8(data))
      }
      default:
        throw new Error('Unknown asymmetric algo version "' + chunks.algoVersion + '"')
    }
  })
}

exports.encryptAsymmetricWith = encryptAsymmetricWith

function encryptAsymmetricWith (publicJwk, serializer) {
  serializer = serializer || JSON.stringify
  return asyncify(function (unencryptedValue) {
    const publicPEM = importPublicKey(publicJwk)
    const publicKey = forge.pki.publicKeyFromPem(publicPEM)
    const enc = publicKey.encrypt(forge.util.encodeUtf8(serializer(unencryptedValue)), 'RSA-OAEP', {
      md: forge.md.sha256.create()
    })
    const result = cipher.serialize(
      Unibabel.binaryStringToBuffer(enc), null, ASYMMETRIC_ALGO_RSA_OAEP
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
    const args = [].slice.call(arguments)
    return Promise.resolve().then(function () {
      return fn.apply(null, args)
    })
  }
}
