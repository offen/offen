/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var Unibabel = require('unibabel').Unibabel

var cipher = require('./versioned-cipher')
var compression = require('./compression')

var SYMMETRIC_ALGO_AESGCM = 1
var ASYMMETRIC_ALGO_RSA_OAEP = 1

exports._impl = 'native'

exports.decryptSymmetricWith = decryptSymmetricWith

function decryptSymmetricWith (jwk, deserializer) {
  deserializer = deserializer || JSON.parse
  var importedKey = importSymmetricKey(jwk)
  return function (encryptedValue, inflate) {
    return importedKey
      .then(function (cryptoKey) {
        var chunks = cipher.deserialize(encryptedValue)
        if (chunks.error) {
          return Promise.reject(chunks.error)
        }
        switch (chunks.algoVersion) {
          case SYMMETRIC_ALGO_AESGCM: {
            return window.crypto.subtle.decrypt(
              {
                name: 'AES-GCM',
                iv: chunks.nonce,
                tagLength: 128
              },
              cryptoKey,
              chunks.cipher
            )
              .then(function (v) {
                return parseDecrypted(v, inflate)
              })
              .then(deserializer)
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

function encryptSymmetricWith (jwk, serializer) {
  serializer = serializer || JSON.stringify
  var importedKey = importSymmetricKey(jwk)
  return function (unencryptedValue, deflate) {
    return importedKey
      .then(function (cryptoKey) {
        var bytes
        try {
          var serializedString = serializer(unencryptedValue)
          if (deflate) {
            bytes = compression.compress(serializedString)
          } else {
            bytes = Promise.resolve(Unibabel.utf8ToBuffer(serializedString))
          }
        } catch (err) {
          return Promise.reject(err)
        }
        var nonce = window.crypto.getRandomValues(new Uint8Array(12)).buffer
        return bytes.then(function (b) {
          return window.crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: nonce,
              tagLength: 128
            },
            cryptoKey,
            b
          )
        })
          .then(function (encrypted) {
            return cipher.serialize(
              encrypted,
              nonce,
              SYMMETRIC_ALGO_AESGCM
            )
          })
      })
  }
}

exports.decryptAsymmetricWith = decryptAsymmetricWith

function decryptAsymmetricWith (privateJwk, deserializer) {
  deserializer = deserializer || JSON.parse
  var importedKey = importPrivateKey(privateJwk)
  return function (encryptedValue) {
    return importedKey
      .then(function (privateCryptoKey) {
        var chunks = cipher.deserialize(encryptedValue)
        if (chunks.error) {
          return Promise.reject(chunks.error)
        }
        switch (chunks.algoVersion) {
          case ASYMMETRIC_ALGO_RSA_OAEP: {
            return window.crypto.subtle.decrypt(
              {
                name: 'RSA-OAEP'
              },
              privateCryptoKey,
              chunks.cipher
            )
              .then(parseDecrypted)
              .then(deserializer)
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

function encryptAsymmetricWith (publicJwk, serializer) {
  serializer = serializer || JSON.stringify
  var importedKey = importPublicKey(publicJwk)
  return function (unencryptedValue) {
    return importedKey
      .then(function (publicCryptoKey) {
        var bytes
        try {
          bytes = Unibabel.utf8ToBuffer(serializer(unencryptedValue))
        } catch (err) {
          return Promise.reject(err)
        }
        return window.crypto.subtle.encrypt(
          {
            name: 'RSA-OAEP',
            hash: { name: 'SHA-256' }
          },
          publicCryptoKey,
          bytes
        )
      })
      .then(function (encrypted) {
        return cipher.serialize(encrypted, null, ASYMMETRIC_ALGO_RSA_OAEP)
      })
  }
}

exports.createSymmetricKey = createSymmetricKey

function createSymmetricKey () {
  return window.crypto.subtle
    .generateKey(
      {
        name: 'AES-GCM',
        length: 128
      },
      true,
      ['encrypt', 'decrypt']
    )
    .then(exportKey)
}

function exportKey (key) {
  return window.crypto.subtle.exportKey('jwk', key)
}

function importPrivateKey (jwk) {
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' }
    },
    false,
    ['decrypt']
  )
}

function importPublicKey (jwk) {
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'RSA-OAEP',
      hash: { name: 'SHA-256' }
    },
    false,
    ['encrypt']
  )
}

function importSymmetricKey (jwk) {
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'AES-GCM'
    },
    false,
    ['encrypt', 'decrypt']
  )
}

function parseDecrypted (decrypted, inflate) {
  if (inflate) {
    return compression.decompress(decrypted)
  } else {
    return Promise.resolve(Unibabel.utf8ArrToStr(new Uint8Array(decrypted)))
  }
}
