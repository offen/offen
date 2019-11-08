var html = require('choo/html')

module.exports = withAuthentication

function withAuthentication () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.authenticatedUser) {
        emit('offen:login', null)
        var authenticating = html`
          <div class="row">
            <p class="loading">
              ${__('Checking authentication...')}
            </p>
          </div>
        `
        return authenticating
      }
      return originalView(state, emit)
    }
  }
}
