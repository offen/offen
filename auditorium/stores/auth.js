var uuid = require('uuid/v4')
var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:login', function (credentials) {
    vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var queryRequest = {
          type: 'LOGIN',
          respondWith: uuid(),
          payload: credentials
            ? { credentials: credentials }
            : null
        }
        return postMessage(queryRequest)
      })
      .then(function (response) {
        state.authenticatedUser = response.payload.user
        if (credentials) {
          state.flash = 'You are now logged in.'
          emitter.emit(state.events.PUSHSTATE, '/account')
        }
      })
      .catch(function (err) {
        if (err.status === 401) {
          state.flash = 'Could not log in. Try again.'
          emitter.emit(state.events.PUSHSTATE, '/login')
          return
        }
        state.error = err
      })
      .then(function () {
        emitter.emit(state.events.RENDER)
      })
  })
}
