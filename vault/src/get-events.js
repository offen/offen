const Unibabel = require('unibabel').Unibabel

const getDatabase = require('./database')

module.exports = getEvents

function getEvents (query) {
  return window
    .fetch(`${process.env.SERVER_HOST}/events`, {
      method: 'GET',
      credentials: 'include'
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
    .then(function (payload) {
      const db = getDatabase()
      const decrypted = payload.events.map(function (event) {
        return db.secrets.get({ accountId: event.account_id })
          .then(function (result) {
            const userSecret = result.userSecret
            return window.crypto.subtle
              .decrypt({
                name: 'AES-CTR',
                counter: new Uint8Array(16),
                length: 128
              }, userSecret, Unibabel.base64ToArr(event.payload))
              .then(function (decrypted) {
                const payloadAsString = Unibabel.utf8ArrToStr(new Uint8Array(decrypted))
                return Object.assign({}, event, { payload: payloadAsString })
              })
          })
      })
      return Promise.all(decrypted)
    })
}
