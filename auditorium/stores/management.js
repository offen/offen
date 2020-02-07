var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:invite-user', function (payload, onSuccessMessage, onFailureMessage) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        return postMessage({
          type: 'INVITE_USER',
          payload: payload
        })
      })
      .then(function (response) {
        switch (response.type) {
          case 'INVITE_USER_SUCCESS':
            state.flash = onSuccessMessage
            return
          case 'INVITE_USER_FAILURE':
            state.flash = onFailureMessage
            return
          default:
            throw new Error('Unhandled response of type "' + response.type + '"')
        }
      })
      .catch(function (err) {
        state.error = {
          error: err.message,
          stack: err.originalStack || err.stack
        }
      })
      .then(function () {
        emitter.emit(state.events.RENDER)
      })
  })

  emitter.on('offen:join', function (update, onSuccessMessage, onFailureMessage) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var queryRequest = {
          type: 'JOIN',
          payload: update
        }
        return postMessage(queryRequest)
      })
      .then(function (response) {
        switch (response.type) {
          case 'JOIN_SUCCESS':
            Object.assign(state, {
              authenticatedUser: null,
              flash: onSuccessMessage
            })
            emitter.emit(state.events.PUSHSTATE, '/login/')
            return
          case 'JOIN_FAILURE':
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

  emitter.on('offen:create-account', function (payload, onSuccessMessage, onFailureMessage, callback) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        var message = {
          type: 'CREATE_ACCOUNT',
          payload: payload
        }
        return postMessage(message)
      })
      .then(function (response) {
        switch (response.type) {
          case 'CREATE_ACCOUNT_SUCCESS':
            state.flash = onSuccessMessage
            return
          case 'CREATE_ACCOUNT_FAILURE':
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
        if (callback) {
          callback(state, emitter)
        } else {
          emitter.emit(state.events.RENDER)
        }
      })
  })
}

store.storeName = 'management'
