var uuid = require('uuid/v4')
var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:purge', function () {
    vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var queryRequest = {
          type: 'PURGE',
          respondWith: uuid(),
          payload: null
        }
        return postMessage(queryRequest)
      })
      .then(function (message) {
        state.model = message.payload.result
      })
      .catch(function (err) {
        state.error = {
          message: err.message,
          stack: err.originalStack || err.stack
        }
      })
      .then(function () {
        emitter.emit(state.events.RENDER)
      })
  })

  emitter.on('offen:query', function (data) {
    var fetchQuery = vault(process.env.VAULT_HOST)
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
    var fetchOptoutStatus = vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var queryRequest = {
          type: 'OPTOUT_STATUS',
          respondWith: uuid(),
          payload: null
        }
        return postMessage(queryRequest)
      })

    Promise.all([fetchQuery, fetchOptoutStatus])
      .then(function (results) {
        var queryMessage = results[0]
        var optoutMessage = results[1]
        state.model = queryMessage.payload.result
        state.model.hasOptedOut = optoutMessage.payload.hasOptedOut
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
        emitter.emit(state.events.RENDER)
      })
  })
}

store.storeName = 'data'
