var uuid = require('uuid/v4')
var vault = require('offen/vault')

module.exports = store

function store (state, emitter) {
  emitter.on('offen:login', function (credentials, returnUrl) {
    if (returnUrl) {
      state.returnUrl = returnUrl
    }
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
      .then(function () {
        state.authenticated = true
        if (credentials) {
          emitter.emit(state.events.PUSHSTATE, state.returnUrl || '/account')
          delete state.returnUrl
        }
      })
      .catch(function (err) {
        if (err.status === 401) {
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
