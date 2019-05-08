const Unibabel = require('unibabel').Unibabel
const ensureUserSecret = require('./src/user-secret')

window.addEventListener('message', function (event) {
  let payload
  try {
    payload = JSON.parse(event.data)
  } catch (err) {
    console.warn('Received malformed event, skipping.')
    return
  }
  let userSecret
  ensureUserSecret(payload.accountId, process.env.SERVER_HOST)
    .then(function (_userSecret) {
      userSecret = _userSecret
      return window.crypto.subtle.encrypt({
        name: 'AES-CTR',
        counter: new Uint8Array(16),
        length: 128
      },
      userSecret,
      Unibabel.utf8ToBuffer(JSON.stringify(payload.event)))
    })
    .then(function (encrypted) {
      const encryptedEventPayload = Unibabel.arrToBase64(new Uint8Array(encrypted))
      return window
        .fetch(`${process.env.SERVER_HOST}/events`, {
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({
            account_id: payload.accountId,
            payload: encryptedEventPayload
          })
        })
        .then(function (response) {
          if (response.status >= 400) {
            return response.json().then(function (errorBody) {
              const err = new Error(errorBody.error)
              err.status = response.status
              throw err
            })
          }
          return response.json()
        })
    })
    .then(function () {
      return window
        .fetch(`${process.env.SERVER_HOST}/events`, {
          method: 'GET',
          credentials: 'include'
        })
        .then(function (response) {
          return response.json()
        })
    })
    .then(function (result) {
      return Promise.all(result.events.map(function (event) {
        return window.crypto.subtle
          .decrypt({
            name: 'AES-CTR',
            counter: new Uint8Array(16),
            length: 128
          }, userSecret, Unibabel.base64ToBuffer(event.payload))
          .then((encrypted) => Unibabel.bufferToUtf8(new Uint8Array(encrypted)))
          .then(JSON.parse)
      }))
    })
    .then(function (result) {
      console.log(result)
    })
    .catch(function (err) {
      console.error(err)
    })
})
