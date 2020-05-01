/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

var bindCrypto = require('./bind-crypto')

module.exports = decryptEventsWith({})
module.exports.decryptEventsWith = decryptEventsWith

function decryptEventsWith (cache) {
  return bindCrypto(function (encryptedEvents, secrets, privateJWK) {
    var crypto = this
    var decryptWithAccountKey = crypto.decryptAsymmetricWith(privateJWK)
    var secretsById

    function getMatchingSecret (secretId) {
      function doDecrypt () {
        return Promise.resolve(secrets)
          .then(function (secrets) {
            secretsById = secretsById || _.indexBy(secrets, 'secretId')
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
          })
      }
      if (cache) {
        cache[secretId] = cache[secretId] || doDecrypt()
        return cache[secretId]
      }
      return doDecrypt()
    }

    var decryptedEvents = encryptedEvents
      .map(function (encryptedEvent) {
        if (cache && cache[encryptedEvent.eventId]) {
          return cache[encryptedEvent.eventId]
        }
        var decryptPayload
        if (encryptedEvent.secretId === null) {
          decryptPayload = decryptWithAccountKey
        } else {
          decryptPayload = function (payload) {
            return getMatchingSecret(encryptedEvent.secretId)
              .then(function (secret) {
                if (!secret) {
                  return null
                }
                return crypto.decryptSymmetricWith(secret.jwk)(payload)
              })
          }
        }
        return decryptPayload(encryptedEvent.payload)
          .then(function (decryptedPayload) {
            var withDecryptedPayload = Object.assign(
              {}, encryptedEvent, { payload: decryptedPayload }
            )
            if (cache) {
              cache[withDecryptedPayload.eventId] = withDecryptedPayload
            }
            return withDecryptedPayload
          })
          .catch(function () {
            return null
          })
      })
    return Promise.all(decryptedEvents).then(_.compact)
  })
}
