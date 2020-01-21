var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  function handleRequest (request, onSuccessMessage, softFailure) {
    state.updatePending = true
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        return postMessage(request)
      })
      .then(function (queryMessage) {
        state.model = queryMessage.payload.result
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
      if (document.hasFocus()) {
        emitter.emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser, true)
      } else {
        window.onfocus = function () {
          emitter.emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser, true)
          window.onfocus = Function.prototype
        }
      }
    }, interval)
  })
}

store.storeName = 'data'
