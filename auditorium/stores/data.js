var vault = require('offen/vault')
var _ = require('underscore')

module.exports = store

function store (state, emitter) {
  function handleRequest (request, onSuccessMessage, softFailure) {
    state.updatePending = true
    var fetchQuery = vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        return postMessage(request)
      })
    var fetchOptinStatus = vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var request = {
          type: 'OPTIN_STATUS',
          payload: null
        }
        return postMessage(request)
      })

    Promise.all([fetchQuery, fetchOptinStatus])
      .then(function (results) {
        var queryMessage = results[0]
        var optinMessage = results[1]
        state.model = queryMessage.payload.result
        Object.assign(state.model, optinMessage.payload)
        state.flash = state.flash || onSuccessMessage
      })
      .catch(function (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error(err)
        }
        state.flash = null
        if (!softFailure) {
          state.error = {
            message: err.message,
            stack: err.originalStack || err.stack
          }
        } else {
          state.flash = __(
            'This view failed to update automatically, data may be out of date. Check your network connection if the problem persists.'
          )
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
    }, __('Your usage data has been deleted.'))
  })

  emitter.on('offen:query', function (data, authenticatedUser, softFailure) {
    handleRequest({
      type: 'QUERY',
      payload: data
        ? { query: data, authenticatedUser: authenticatedUser }
        : { authenticatedUser: authenticatedUser }
    }, null, softFailure)
  })

  emitter.on('offen:schedule-refresh', function (interval) {
    if (state.interval) {
      return
    }
    state.interval = window.setInterval(function () {
      if (state.updatePending) {
        return
      }
      emitter.emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser, true)
    }, interval)
  })

  emitter.on(state.events.NAVIGATE, function () {
    delete state.updatePending
    if (state.route === state.previousRoute && _.isEqual(state.params, state.previousParams)) {
      // This means the only thing that changed are query parameters and the
      // application is likely going to update the same view with new data.
      state.stale = true
      emitter.emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser)
    } else {
      window.clearInterval(state.interval)
      delete state.interval
      delete state.model
    }
  })
}

store.storeName = 'data'
