var _ = require('underscore')

var crypto = require('./crypto')

module.exports = decryptEventsWith({})
module.exports.decryptEventsWith = decryptEventsWith

function decryptEventsWith (cache) {
  return function (encryptedEvents, userSecrets, privateKey) {
    var decryptWithAccountKey = crypto.decryptAsymmetricWith(privateKey)
    return Promise.resolve(userSecrets)
      .then(function (userSecrets) {
        var decryptions = userSecrets
          .map(function (userSecret) {
            if (cache && cache[userSecret.userId]) {
              return cache[userSecret.userId]
            }

            return decryptWithAccountKey(userSecret.value)
              .then(crypto.importSymmetricKey)
              .then(function (cryptoKey) {
                var withKey = Object.assign(
                  {}, userSecret, { cryptoKey: cryptoKey }
                )
                if (cache) {
                  cache[withKey.userId] = withKey
                }
                return withKey
              })
          })
        return Promise.all(decryptions)
      })
      .then(function (decryptedSecrets) {
        return Promise.all([
          _.indexBy(decryptedSecrets, 'userId'),
          encryptedEvents
        ])
      })
      .then(function (results) {
        var secretsById = results[0]
        var encryptedEvents = results[1]
        var decryptedEvents = encryptedEvents
          .map(function (event) {
            if (cache && cache[event.eventId]) {
              return cache[event.eventId]
            }

            var decryptEvent
            if (event.userId === null) {
              decryptEvent = decryptWithAccountKey
            } else {
              var userSecret = secretsById[event.userId] && secretsById[event.userId].cryptoKey
              if (!userSecret) {
                return null
              }
              decryptEvent = crypto.decryptSymmetricWith(userSecret)
            }
            return decryptEvent(event.payload)
              .then(function (decryptedPayload) {
                var withPayload = Object.assign(
                  {}, event, { payload: decryptedPayload }
                )
                if (cache) {
                  cache[withPayload.eventId] = withPayload
                }
                return withPayload
              })
              .catch(function () {
                return null
              })
          })
        return Promise.all(decryptedEvents).then(_.compact)
      })
  }
}
