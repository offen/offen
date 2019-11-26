var html = require('choo/html')

module.exports = withAuthentication

function withAuthentication () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.authenticatedUser) {
        emit('offen:login', null)
        var authenticating = html`
          <p class="loading dib pa2 br2 bg-black-05 mt0 mb2">
            ${__('Checking authentication...')}
          </p>
        `
        return authenticating
      }
      return originalView(state, emit)
    }
  }
}
