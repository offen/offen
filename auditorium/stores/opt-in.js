var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:optin', function (allow) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var optoutRequest = {
          type: 'OPTIN',
          payload: {
            expressConsent: allow
          }
        }
        return postMessage(optoutRequest, true)
      })
      .then(function () {
        emitter.emit('offen:query')
      })
      .catch(function (err) {
        state.error = err
        emitter.emit(state.events.RENDER)
      })
  })
}
