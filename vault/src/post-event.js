const Unibabel = require('unibabel').Unibabel

const ensureUserSecret = require('./user-secret')

module.exports = postEvent

function postEvent (accountId, event, flush) {
  let userSecret
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
      const encryptedEventPayload = Unibabel.arrToBase64(new Uint8Array(encrypted))
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
              const err = new Error(errorBody.error)
              err.status = response.status
              throw err
            })
          }
          return response.json()
        })
    })
}
