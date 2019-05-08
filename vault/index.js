const ensureUserSecret = require('./src/user-secret')

window.addEventListener('message', function (event) {
  let payload
  try {
    payload = JSON.parse(event.data)
  } catch (err) {
    console.warn('Received malformed event, skipping.')
    return
  }

  ensureUserSecret(payload.accountId, process.env.SERVER_HOST)
    .then(function (userSecret) {
      const enc = new TextEncoder()
      return window.crypto.subtle.encrypt({
        name: 'AES-CTR',
        counter: new Uint8Array(16),
        length: 128
      },
      userSecret,
      enc.encode(JSON.stringify(payload.event)))
    })
    .then(function (encrypted) {
      const encryptedEventPayload = arrayBufferToBase64(encrypted)
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
    .then(function (result) {
      console.log(result)
    })
    .catch(function (err) {
      console.error(err)
    })
})

function arrayBufferToBase64 (byteArray) {
  const chars = Array.from(new Uint8Array(byteArray))
    .map(function (byte) {
      return String.fromCharCode(byte)
    })
  return window.btoa(chars.join(''))
}
