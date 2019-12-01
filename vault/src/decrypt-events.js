var _ = require('underscore')

var bindCrypto = require('./bind-crypto')

module.exports = decryptEventsWith({})
module.exports.decryptEventsWith = decryptEventsWith

function decryptEventsWith (cache) {
  return bindCrypto(function (encryptedEvents, userSecrets, privateKey) {
    var crypto = this
    var decryptWithAccountKey = crypto.decryptAsymmetricWith(privateKey)

    function getMatchingUserSecret (userId) {
      function doDecrypt () {
        return Promise.resolve(userSecrets)
          .then(function (userSecrets) {
            var userSecret = _.findWhere(userSecrets, { userId: userId })
            if (!userSecret) {
              return Promise.reject(
                new Error('Unable to find matching user secret')
              )
            }

            return decryptWithAccountKey(userSecret.value)
              .then(crypto.importSymmetricKey)
              .then(function (cryptoKey) {
                var withKey = Object.assign(
                  {}, userSecret, { cryptoKey: cryptoKey }
                )
                return withKey
              })
          })
      }
      if (cache) {
        cache[userId] = cache[userId] || doDecrypt()
        return cache[userId]
      }
      return doDecrypt()
    }

    var decryptedEvents = encryptedEvents
      .map(function (encryptedEvent) {
        if (cache && cache[encryptedEvent.eventId]) {
          return cache[encryptedEvent.eventId]
        }
        var decryptPayload
        if (encryptedEvent.userId === null) {
          decryptPayload = decryptWithAccountKey
        } else {
          decryptPayload = function (payload) {
            return getMatchingUserSecret(encryptedEvent.userId)
              .then(function (userSecret) {
                if (!userSecret) {
                  return null
                }
                return crypto.decryptSymmetricWith(userSecret.cryptoKey)(payload)
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
