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
        switch (response.type) {
          case 'LOGIN_SUCCESS':
            state.authenticatedUser = response.payload
            if (credentials) {
              var firstAccount = state.authenticatedUser.accounts[0].accountId
              emitter.emit(state.events.PUSHSTATE, '/auditorium/' + firstAccount)
            }
            return
          case 'LOGIN_FAILURE':
            state.flash = onFailureMessage
            if (!credentials) {
              emitter.emit(state.events.PUSHSTATE, '/login/')
            }
            return
          default:
            throw new Error('Received unknown response type: ' + response.type)
        }
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
        switch (response.type) {
          case 'CHANGE_CREDENTIALS_SUCCESS':
            state.authenticatedUser = null
            state.flash = onSuccessMessage
            emitter.emit(state.events.PUSHSTATE, '/login/')
            return
          case 'CHANGE_CREDENTIALS_FAILURE':
            state.flash = onFailureMessage
            return
          default:
            throw new Error('Received unknown response type: ' + response.type)
        }
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
        switch (response.type) {
          case 'FORGOT_PASSWORD_SUCCESS':
            state.authenticatedUser = null
            state.flash = onSuccessMessage
            return
          case 'FORGOT_PASSWORD_FAILURE':
            state.flash = onFailureMessage
            return
          default:
            throw new Error('Received unknown response type: ' + response.type)
        }
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
        switch (response.type) {
          case 'RESET_PASSWORD_SUCCESS':
            state.authenticatedUser = null
            state.flash = onSuccessMessage
            emitter.emit(state.events.PUSHSTATE, '/login/')
            return
          case 'RESET_PASSWORD_FAILURE':
            state.flash = onFailureMessage
            return
          default:
            throw new Error('Received unknown response type: ' + response.type)
        }
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

  emitter.on('offen:logout', function (onSuccessMessage, onFailureMessage) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var queryRequest = {
          type: 'LOGOUT',
          payload: null
        }
        return postMessage(queryRequest)
      })
      .then(function (response) {
        switch (response.type) {
          case 'LOGOUT_SUCCESS':
            Object.assign(state, {
              authenticatedUser: null,
              flash: state.flash || onSuccessMessage
            })
            emitter.emit(state.events.PUSHSTATE, '/login/')
            return
          case 'LOGOUT_FAILURE':
            state.flash = onFailureMessage
            return
          default:
            throw new Error('Received unknown response type: ' + response.type)
        }
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
