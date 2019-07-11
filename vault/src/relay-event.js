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
  var relayEvent = function (accountId, event, anonymous) {
  // `flush` is not supposed to be part of the public signature, but will only
  // be used when the function recursively calls itself
    var flush = arguments[3] || false
    event = prepareEventData(event, accountId, anonymous)

    // if data is collected anonymously, the account's public key is used
    // for encrypting the payload instead
    var getSecret = anonymous
      ? api.getPublicKey(accountId).then(crypto.importPublicKey).then(crypto.encryptAsymmetricWith)
      : ensureUserSecret(accountId, flush).then(crypto.encryptSymmetricWith)

    return getSecret
      .then(function (encryptEventPayload) {
        return encryptEventPayload(event)
      })
      .then(function (encryptedEventPayload) {
        return api.postEvent({
          accountId: accountId,
          payload: encryptedEventPayload
        }, anonymous)
          .catch(function (err) {
            // a 400 response is sent in case no cookie is present in the request.
            // This means the secret exchange can happen one more time
            // before retrying to send the event.
            if (err.status === 400 && !flush && !anonymous) {
              return relayEvent(accountId, event, anonymous, true)
            }
            throw err
          })
      })
  }
  return relayEvent
}

// prepareEventData adds properties to an event that could be subject to spoofing
// or unwanted access by 3rd parties in "script". For example adding the session id
// here instead of the script prevents other scripts from reading this value.
function prepareEventData (inboundPayload, accountId, anonymous) {
  var now = new Date()
  if (anonymous) {
    return {
      timestamp: now,
      type: inboundPayload.type
    }
  }
  return Object.assign({}, inboundPayload, {
    timestamp: now,
    sessionId: getSessionId(accountId)
  })
}

function getSessionId (accountId) {
  // even though the session identifier will be included in the encrypted part
  // of the event we generate a unique identifier per account so that each session
  // is unique per account and cannot be cross-referenced
  var sessionId
  try {
    var lookupKey = 'session-' + accountId
    sessionId = window.sessionStorage.getItem(lookupKey)
    if (!sessionId) {
      sessionId = uuid()
      window.sessionStorage.setItem(lookupKey, sessionId)
    }
  } catch (err) {
    sessionId = uuid()
  }
  return sessionId
}
