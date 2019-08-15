var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:optout', function (status) {
    vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var optoutRequest = {
          type: 'OPTOUT',
          payload: {
            status: status
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
