var _ = require('underscore')

module.exports = store

function store (state, emitter) {
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
      delete state.consentStatus
    }
  })
}

store.name = 'navigation'
