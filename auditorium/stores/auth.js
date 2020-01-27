var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:login', function (credentials, onFailureMessage) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var queryRequest = {
          type: 'LOGIN',
          payload: credentials
            ? { credentials: credentials }
            : null
        }
        return postMessage(queryRequest)
      })
      .then(function (response) {
        if (response.type === 'LOGIN_SUCCESS') {
          state.authenticatedUser = response.payload
          var firstAccount = state.authenticatedUser.accounts[0].accountId
          if (credentials) {
            emitter.emit(state.events.PUSHSTATE, '/auditorium/' + firstAccount)
          }
          return
        } else if (response.type === 'LOGIN_FAILURE') {
          state.flash = onFailureMessage
          if (!credentials) {
            emitter.emit(state.events.PUSHSTATE, '/login/')
          }
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

  emitter.on('offen:change-credentials', function (update, onSuccessMessage, onFailureMessage) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var queryRequest = {
          type: 'CHANGE_CREDENTIALS',
          payload: update
        }
        return postMessage(queryRequest)
      })
      .then(function (response) {
        if (response.type === 'CHANGE_CREDENTIALS_SUCCESS') {
          Object.assign(state, {
            authenticatedUser: null,
            flash: onSuccessMessage
          })
          emitter.emit(state.events.PUSHSTATE, '/login/')
          return
        } else if (response.type === 'CHANGE_CREDENTIALS_FAILURE') {
          state.flash = onFailureMessage
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

  emitter.on('offen:forgot-password', function (update, onSuccessMessage, onFailureMessage) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var queryRequest = {
          type: 'FORGOT_PASSWORD',
          payload: update
        }
        return postMessage(queryRequest)
      })
      .then(function (response) {
        if (response.type === 'FORGOT_PASSWORD_SUCCESS') {
          Object.assign(state, {
            authenticatedUser: null,
            flash: onSuccessMessage
          })
          return
        } else if (response.type === 'FORGOT_PASSWORD_FAILURE') {
          state.flash = onFailureMessage
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

  emitter.on('offen:reset-password', function (update, onSuccessMessage, onFailureMessage) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var queryRequest = {
          type: 'RESET_PASSWORD',
          payload: update
        }
        return postMessage(queryRequest)
      })
      .then(function (response) {
        if (response.type === 'RESET_PASSWORD_SUCCESS') {
          Object.assign(state, {
            authenticatedUser: null,
            flash: onSuccessMessage
          })
          emitter.emit(state.events.PUSHSTATE, '/login/')
          return
        } else if (response.type === 'RESET_PASSWORD_FAILURE') {
          state.flash = onFailureMessage
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
