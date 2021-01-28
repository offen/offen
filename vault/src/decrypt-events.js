/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const _ = require('underscore')

const bindCrypto = require('./bind-crypto')

module.exports = decryptEventsWith({})
module.exports.decryptEventsWith = decryptEventsWith

function decryptEventsWith (cache) {
  return bindCrypto(function (encryptedEvents, encryptedSecrets, privateJWK) {
    const crypto = this
    const decryptWithAccountKey = crypto.decryptAsymmetricWith(privateJWK)
    const secretsById = _.indexBy(encryptedSecrets, 'secretId')

    function getMatchingSecret (secretId) {
      if (cache) {
        cache[secretId] = cache[secretId] || doDecryptSecret()
        return cache[secretId]
      }
      return doDecryptSecret()

      function doDecryptSecret () {
        const secret = secretsById[secretId]
        if (!secret) {
          return Promise.reject(
            new Error('Unable to find matching secret')
          )
        }

        return decryptWithAccountKey(secret.value)
          .then(function (jwk) {
            const withKey = Object.assign(
              {}, secret, { jwk: jwk }
            )
            return withKey
          })
      }
    }

    const decryptedEvents = encryptedEvents
      .map(function (encryptedEvent) {
        const eventId = encryptedEvent.eventId
        const secretId = encryptedEvent.secretId
        const payload = encryptedEvent.payload

        if (cache) {
          cache[eventId] = cache[eventId] || doDecryptEvent()
          return cache[eventId]
        }

        return doDecryptEvent()

        function doDecryptEvent () {
          return getMatchingSecret(secretId)
            .then(function (secret) {
              return crypto.decryptSymmetricWith(secret.jwk)(payload)
            })
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
