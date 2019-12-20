var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:consent', function (allow) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var consentRequest = {
          type: 'CONSENT',
          payload: {
            expressConsent: allow
          }
        }
        return postMessage(consentRequest)
      })
      .then(function () {
        emitter.emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser)
      })
      .catch(function (err) {
        state.error = err
        emitter.emit(state.events.RENDER)
      })
  })
}
