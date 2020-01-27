var html = require('choo/html')

module.exports = withAuthentication

function withAuthentication () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.authenticatedUser) {
        emit('offen:login', null, __('Please log in using your credentials.'))
        var authenticating = html`
          <p class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">
            ${__('Checking authentication...')}
          </p>
        `
        return authenticating
      }
      return originalView(state, emit)
    }
  }
}
