var Unibabel = require('unibabel').Unibabel
var uuidv4 = require('uuid/v4')
var handleFetchResponse = require('offen/fetch-response')

var ensureUserSecret = require('./user-secret')

module.exports = postEvent

// postEvent transmits the given event to the server API associating it with
// the given accountId. It ensures a local user secret exists for the given
// accountId and uses it to encrypt the event payload before performing the request.
function postEvent (accountId, event) {
  // `flush` is not supposed to be part of the public signature, but will only
  // be used when the function recursively calls itself
  var flush = arguments[2] || false
  var userSecret
  event = augmentEventData(event, accountId)
  return ensureUserSecret(accountId, process.env.SERVER_HOST, flush)
    .then(function (_userSecret) {
      userSecret = _userSecret
      return window.crypto.subtle.encrypt({
        name: 'AES-CTR',
        counter: new Uint8Array(16),
        length: 128
      },
      userSecret,
      Unibabel.utf8ToBuffer(JSON.stringify(event)))
    })
    .then(function (encrypted) {
      var encryptedEventPayload = Unibabel.arrToBase64(new Uint8Array(encrypted))
      return window
        .fetch(`${process.env.SERVER_HOST}/events`, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            account_id: accountId,
            payload: encryptedEventPayload
          })
        })
        .then(function (response) {
          if (response.status === 400 && !flush) {
            return postEvent(accountId, event, true)
          }
          return handleFetchResponse(response)
        })
    })
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
    sessionId = uuidv4()
    window.sessionStorage.setItem(lookupKey, sessionId)
  }
  return Object.assign({}, inboundPayload, {
    timestamp: new Date(),
    sessionId: sessionId
  })
}
