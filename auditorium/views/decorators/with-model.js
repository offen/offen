var html = require('choo/html')

module.exports = withModel

function withModel () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.model) {
        emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser)
        return html`
          <p class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">
            ${__('Fetching and decrypting the latest data...')}
          </p>
        `
      }
      return originalView(state, emit)
    }
  }
}
