var html = require('choo/html')

var layout = require('./../_layout')

module.exports = withAuthentication

function withAuthentication () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.authenticated) {
        emit('offen:login', null, state.href)
        var authenticating = html`
          <p class="loading">Checking authentication...</p>
        `
        return layout(authenticating)
      }
      return originalView(state, emit)
    }
  }
}
