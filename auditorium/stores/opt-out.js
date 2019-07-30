var uuid = require('uuid/v4')
var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:optout', function (status) {
    vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var optoutRequest = {
          type: 'OPTOUT',
          respondWith: uuid(),
          payload: {
            status: status
          }
        }
        return postMessage(optoutRequest)
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
