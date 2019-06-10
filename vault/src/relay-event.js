var uuid = require('uuid/v4')

var crypto = require('./crypto')
var ensureUserSecret = require('./user-secret')
var api = require('./api')

module.exports = relayEventWith(api, ensureUserSecret)
module.exports.relayEventWith = relayEventWith

// relayEvent transmits the given event to the server API associating it with
// the given accountId. It ensures a local user secret exists for the given
// accountId and uses it to encrypt the event payload before performing the request.
function relayEventWith (api, ensureUserSecret) {
  var relayEvent = function (accountId, event) {
  // `flush` is not supposed to be part of the public signature, but will only
  // be used when the function recursively calls itself
    var flush = arguments[2] || false
    event = augmentEventData(event, accountId)
    return ensureUserSecret(accountId, flush)
      .then(function (userSecret) {
        var encryptEventPayload = crypto.encryptSymmetricWith(userSecret)
        return encryptEventPayload(event)
      })
      .then(function (encryptedEventPayload) {
        return api.postEvent({
          account_id: accountId,
          payload: encryptedEventPayload
        })
          .catch(function (err) {
            // a 400 response is sent in case no cookie is present in the request.
            // This means the secret exchange can happen one more time
            // before retrying to send the event.
            if (err.status === 400 && !flush) {
              return relayEvent(accountId, event, true)
            }
            throw err
          })
      })
  }
  return relayEvent
}

// augmentEventData adds properties to an event that could be subject to spoofing
// or unwanted access by 3rd parties in "script". For example adding the session id
// here instead of the script prevents other scripts from reading this value.
function augmentEventData (inboundPayload, accountId) {
  // even though the session identifier will be included in the encrypted part
  // of the event we generate a unique identifier per account so that each session
  // is unique per account and cannot be cross-referenced
  var lookupKey = 'session-' + accountId
  var sessionId = window.sessionStorage.getItem(lookupKey)
  if (!sessionId) {
    sessionId = uuid()
    window.sessionStorage.setItem(lookupKey, sessionId)
  }
  return Object.assign({}, inboundPayload, {
    timestamp: new Date(),
    sessionId: sessionId
  })
}
