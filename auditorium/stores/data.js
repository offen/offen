var vault = require('offen/vault')
var _ = require('underscore')

module.exports = store

function store (state, emitter) {
  function handleRequest (request, onSuccessMessage) {
    var fetchQuery = vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        return postMessage(request, true)
      })
    var fetchOptoutStatus = vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var request = {
          type: 'OPTOUT_STATUS',
          payload: null
        }
        return postMessage(request, true)
      })

    Promise.all([fetchQuery, fetchOptoutStatus])
      .then(function (results) {
        var queryMessage = results[0]
        var optoutMessage = results[1]
        state.model = queryMessage.payload.result
        Object.assign(state.model, optoutMessage.payload)
        state.flash = onSuccessMessage
      })
      .catch(function (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(err)
        }
        state.flash = null
        state.error = {
          message: err.message,
          stack: err.originalStack || err.stack
        }
      })
      .then(function () {
        delete state.stale
        delete state.updatePending
        emitter.emit(state.events.RENDER)
      })
  }

  emitter.on('offen:purge', function () {
    handleRequest({
      type: 'PURGE',
      payload: null
    }, __('Your user data has been deleted.'))
  })

  emitter.on('offen:query', function (data, authenticatedUser) {
    handleRequest({
      type: 'QUERY',
      payload: data
        ? { query: data, authenticatedUser: authenticatedUser }
        : { authenticatedUser: authenticatedUser }
    })
  })

  emitter.on(state.events.NAVIGATE, function () {
    if (state.route === state.previousRoute && _.isEqual(state.params, state.previousParams)) {
      // This means the only thing that changed are query parameters and the
      // application is likely going to update the same view with new data.
      state.stale = true
      state.updatePending = true
      emitter.emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser)
    } else {
      delete state.model
    }
  })
}

store.storeName = 'data'
