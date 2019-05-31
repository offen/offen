var uuid = require('uuid/v4')
var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:query', function (data) {
    vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var queryRequest = {
          type: 'QUERY',
          respondWith: uuid(),
          payload: data
            ? { query: data }
            : null
        }
        return postMessage(queryRequest)
      })
      .then(function (message) {
        state.model = { events: message.payload.result }
      })
      .catch(function (err) {
        console.error(err)
        state.model.error = err
      })
      .then(function () {
        emitter.emit(state.events.RENDER)
      })
  })
}

store.storeName = 'data'
