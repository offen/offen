var html = require('choo/html')

module.exports = withAuthentication

function withAuthentication () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.authenticatedUser) {
        emit('offen:login', null)
        var authenticating = html`
          <div class="row">
            <div class="loading">
              ${__('Checking authentication...')}
            </div>
          </div>
        `
        return authenticating
      }
      return originalView(state, emit)
    }
  }
}
