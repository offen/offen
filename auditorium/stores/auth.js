var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:login', function (credentials) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var queryRequest = {
          type: 'LOGIN',
          payload: credentials
            ? { credentials: credentials }
            : null
        }
        return postMessage(queryRequest, true)
      })
      .then(function (response) {
        if (response.type === 'LOGIN_SUCCESS') {
          state.authenticatedUser = response.payload
          if (credentials) {
            state.flash = 'You are now logged in.'
            emitter.emit(state.events.PUSHSTATE, '/auditorium/account')
          }
          return
        } else if (response.type === 'LOGIN_FAILURE') {
          state.flash = 'Could not log in. Try again.'
          emitter.emit(state.events.PUSHSTATE, '/auditorium/login')
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

  emitter.on('offen:change-credentials', function (update) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var queryRequest = {
          type: 'CHANGE_CREDENTIALS',
          payload: update
        }
        return postMessage(queryRequest, true)
      })
      .then(function (response) {
        if (response.type === 'CHANGE_CREDENTIALS_SUCCESS') {
          Object.assign(state, {
            authenticatedUser: null,
            flash: 'Please log in again, using your new credentials.'
          })
          emitter.emit(state.events.PUSHSTATE, '/auditorium/login')
          return
        } else if (response.type === 'CHANGE_CREDENTIALS_FAILURE') {
          state.flash = 'Could not change credentials. Try again.'
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
