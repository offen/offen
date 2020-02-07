var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:invite-user', function (emailAddress, onSuccessMessage, onFailureMessage) {
    vault(process.env.VAULT_HOST || '/vault/')
      .then(function (postMessage) {
        return postMessage({
          type: 'INVITE_USER',
          payload: {
            emailAddress: emailAddress
          }
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
}

store.storeName = 'management'
