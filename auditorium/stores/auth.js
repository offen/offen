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
        if (response.type === 'LOGIN_SUCCESS') {
          state.authenticatedUser = response.payload.user
          if (credentials) {
            state.flash = 'You are now logged in.'
            emitter.emit(state.events.PUSHSTATE, '/account')
          }
          return
        } else if (response.type === 'LOGIN_FAILURE') {
          state.flash = 'Could not log in. Try again.'
          emitter.emit(state.events.PUSHSTATE, '/login')
          return
        }
        throw new Error('Received unknown response type: ' + response.type)
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
}
