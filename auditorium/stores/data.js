var uuid = require('uuid/v4')
var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  function handleRequest (request) {
    var fetchQuery = vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        return postMessage(request)
      })
    var fetchOptoutStatus = vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var request = {
          type: 'OPTOUT_STATUS',
          respondWith: uuid(),
          payload: null
        }
        return postMessage(request)
      })

    Promise.all([fetchQuery, fetchOptoutStatus])
      .then(function (results) {
        var queryMessage = results[0]
        var optoutMessage = results[1]
        state.model = queryMessage.payload.result
        Object.assign(state.model, optoutMessage.payload)
      })
      .catch(function (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(err)
        }
        state.error = {
          message: err.message,
          stack: err.originalStack || err.stack
        }
      })
      .then(function () {
        emitter.emit(state.events.RENDER)
      })
  }

  emitter.on('offen:purge', function () {
    handleRequest({
      type: 'PURGE',
      respondWith: uuid(),
      payload: null
    })
  })

  emitter.on('offen:query', function (data) {
    handleRequest({
      type: 'QUERY',
      respondWith: uuid(),
      payload: data
        ? { query: data }
        : null
    })
  })

  emitter.on(state.events.NAVIGATE, function () {
    delete state.model
  })
}

store.storeName = 'data'
