var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:express-consent', function (status, callback) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var consentRequest = {
          type: 'EXPRESS_CONSENT',
          payload: {
            status: status
          }
        }
        return postMessage(consentRequest)
      })
      .then(function (message) {
        if (message.payload.status === 'allow') {
          state.flash = __('Your have now opted in. Use the Auditorium to review and manage your data at any time.')
        } else {
          state.flash = __('Your have now opted out and all usage data has been deleted.')
        }
        if (callback) {
          callback(state, emitter)
        }
      })
      .catch(function (err) {
        state.error = err
        emitter.emit(state.events.RENDER)
      })
  })
}
