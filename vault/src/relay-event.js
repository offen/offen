var bindCrypto = require('./bind-crypto')
var ensureUserSecret = require('./user-secret')
var api = require('./api')

module.exports = relayEventWith(api, ensureUserSecret)
module.exports.relayEventWith = relayEventWith

// relayEvent transmits the given event to the server API associating it with
// the given accountId. It ensures a local user secret exists for the given
// accountId and uses it to encrypt the event payload before performing the request.
function relayEventWith (api, ensureUserSecret) {
  var relayEvent = bindCrypto(function (accountId, payload, anonymous) {
    var crypto = this
    // `flush` is not supposed to be part of the public signature, but will only
    // be used when the function recursively calls itself
    var flush = arguments[3] || false
    // if data is collected anonymously, the account's public key is used
    // for encrypting the payload instead
    var getSecret = anonymous
      ? api.getPublicKey(accountId).then(crypto.encryptAsymmetricWith)
      : ensureUserSecret(accountId, flush).then(crypto.encryptSymmetricWith)

    return getSecret
      .then(function (encryptEventPayload) {
        return encryptEventPayload(payload)
      })
      .then(function (encryptedEventPayload) {
        return api
          .postEvent(accountId, encryptedEventPayload, anonymous)
          .catch(function (err) {
            // a 400 response is sent in case no cookie is present in the request.
            // This means the secret exchange can happen one more time
            // before retrying to send the event.
            if (err.status === 400 && !flush && !anonymous) {
              return relayEvent(accountId, payload, anonymous, true)
            }
            throw err
          })
      })
  })
  return relayEvent
}
