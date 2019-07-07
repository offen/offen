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
        state.model = message.payload.result
      })
      .catch(function (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(err)
          if (err.originalStack) {
            console.log('Error has been thrown in vault with original stacktrace:')
            console.log(err.originalStack)
          }
        }
        state.error = {
          message: err.message,
          stack: err.originalStack || err.stack
        }
      })
      .then(function () {
        state.model.loading = false
        emitter.emit(state.events.RENDER)
      })
  })
}

store.storeName = 'data'
