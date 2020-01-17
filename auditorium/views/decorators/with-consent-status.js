var html = require('choo/html')

module.exports = withConsentStatus

function withConsentStatus (requireCookies) {
  return function (originalView) {
    return function (state, emit) {
      if (!state.consentStatus) {
        emit('offen:check-consent', requireCookies)
        return html`
          <p class="loading dib pa2 br2 bg-black-05 mt0 mb2">
            ${__('Checking consent status...')}
          </p>
        `
      }
      return originalView(state, emit)
    }
  }
}
