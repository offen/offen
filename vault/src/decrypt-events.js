/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

var bindCrypto = require('./bind-crypto')
var DecryptionCache = require('./decryption-cache')

module.exports = decryptEventsWith({}, DecryptionCache)
module.exports.decryptEventsWith = decryptEventsWith

function decryptEventsWith (cache, CacheImplementation) {
  return bindCrypto(function (accountId, encryptedEvents, encryptedSecrets, privateJWK) {
    var crypto = this
    var cache = getCacheInstance(accountId)
    var decryptWithAccountKey = crypto.decryptAsymmetricWith(privateJWK)
    var secretsById = _.indexBy(encryptedSecrets, 'secretId')

    function getMatchingSecret (secretId) {
      function doDecrypt () {
        var secret = secretsById[secretId]
        if (!secret) {
          return Promise.reject(
            new Error('Unable to find matching secret')
          )
        }
        return decryptWithAccountKey(secret.value)
          .then(function (jwk) {
            var withKey = Object.assign(
              {}, secret, { jwk: jwk }
            )
            return withKey
          })
      }

      if (cache) {
        return cache.get(secretId)
          .then(function (cachedSecret) {
            return cachedSecret || doDecrypt()
          })
          .then(function (secret) {
            return cache.set(secretId, secret)
              .then(function () {
                return secret
              })
          })
      }
      return doDecrypt()
    }

    var decryptedEvents = encryptedEvents
      .map(function (encryptedEvent) {
        var eventId = encryptedEvent.eventId
        var secretId = encryptedEvent.secretId
        var payload = encryptedEvent.payload

        return Promise.resolve(cache && cache.get(eventId))
          .then(function (cachedResult) {
            if (cachedResult) {
              return cachedResult
            }

            if (!secretId) {
              return decryptWithAccountKey(payload)
            } else {
              return getMatchingSecret(secretId)
                .then(function (secret) {
                  if (!secret) {
                    return null
                  }
                  return crypto.decryptSymmetricWith(secret.jwk)(payload)
                })
            }
          })
          .then(function (decryptedPayload) {
            var withDecryptedPayload = Object.assign(
              {}, encryptedEvent, { payload: decryptedPayload }
            )
            return Promise.resolve(
              cache && cache.set(eventId, decryptedPayload)
            )
              .then(function () {
                return withDecryptedPayload
              })
          })
          .catch(function () {
            return null
          })
      })

    var result
    return Promise.all(decryptedEvents)
      .then(_.compact)
      .then(function (_result) {
        result = _result
        return Promise.resolve(cache && cache.commit())
      })
      .then(function () {
        return result
      })
  })

  function getCacheInstance (accountId) {
    if (!cache) {
      return null
    }
    if (!cache[accountId]) {
      cache[accountId] = new CacheImplementation(accountId)
    }
    return cache[accountId]
  }
}
