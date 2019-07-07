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
          payload: {
            credentials: credentials
          }
        }
        return postMessage(queryRequest)
      })
      .then(function () {
        state.authenticated = true
        if (state.returnUrl) {
          emitter.emit(state.events.PUSHSTATE, state.returnUrl)
          delete state.returnUrl
        } else {
          emitter.emit(state.events.PUSHSTATE, '/account')
        }
      })
      .catch(function (err) {
        state.error = err
      })
      .then(function () {
        emitter.emit(state.events.RENDER)
      })
  })

  emitter.on('offen:authenticate', function (accountId, returnUrl) {
    if (!accountId) {
      setTimeout(function () {
        state.authenticated = true
        emitter.emit(state.events.RENDER)
      }, 0)
      return
    }

    state.returnUrl = returnUrl
    vault(process.env.VAULT_HOST)
      .then(function (postMessage) {
        var queryRequest = {
          type: 'LOGIN',
          respondWith: uuid(),
          payload: null
        }
        return postMessage(queryRequest)
      })
      .then(function () {
        state.authenticated = true
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
