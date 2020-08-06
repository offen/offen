/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

var bindCrypto = require('./bind-crypto')

module.exports = decryptEventsWith({})
module.exports.decryptEventsWith = decryptEventsWith

function decryptEventsWith (cache) {
  return bindCrypto(function (encryptedEvents, encryptedSecrets, privateJWK) {
    var crypto = this
    var decryptWithAccountKey = crypto.decryptAsymmetricWith(privateJWK)
    var secretsById = _.indexBy(encryptedSecrets, 'secretId')

    function getMatchingSecret (secretId) {
      if (cache) {
        cache[secretId] = cache[secretId] || doDecrypt()
        return cache[secretId]
      }
      return doDecrypt()

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
    }

    var decryptedEvents = encryptedEvents
      .map(function (encryptedEvent) {
        var eventId = encryptedEvent.eventId
        var secretId = encryptedEvent.secretId
        var payload = encryptedEvent.payload

        if (cache) {
          cache[eventId] = cache[eventId] || doDecrypt()
          return cache[eventId]
        }

        return doDecrypt()

        function doDecrypt () {
          var result
          if (!secretId) {
            result = decryptWithAccountKey(payload)
          } else {
            result = getMatchingSecret(secretId)
              .then(function (secret) {
                if (!secret) {
                  return null
                }
                return crypto.decryptSymmetricWith(secret.jwk)(payload)
              })
          }

          return result
            .then(function (decryptedPayload) {
              return Object.assign(
                {}, encryptedEvent, { payload: decryptedPayload }
              )
            })
            .catch(function () {
              return null
            })
        }
      })

    return Promise.all(decryptedEvents).then(_.compact)
  })
}
