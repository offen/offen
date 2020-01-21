var html = require('choo/html')

module.exports = withConsentStatus

function withConsentStatus (requireCookies) {
  return function (originalView) {
    return function (state, emit) {
      if (!state.consentStatus) {
        emit('offen:check-consent', requireCookies)
        return html`
          <p class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">
            ${__('Checking consent status...')}
          </p>
        `
      }
      return originalView(state, emit)
    }
  }
}
