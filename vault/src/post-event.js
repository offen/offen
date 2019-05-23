var Unibabel = require('unibabel').Unibabel

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
          } else if (response.status >= 400) {
            return response.json().then(function (errorBody) {
              var err = new Error(errorBody.error)
              err.status = response.status
              throw err
            })
          }
          return response.json()
        })
    })
}
