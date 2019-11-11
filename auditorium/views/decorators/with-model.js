var html = require('choo/html')

module.exports = withModel

function withModel () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.model) {
        emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser)
        var loading = html`
          <p class="loading dib pa2 black br2 bg-black-05 mt0 mb2">${__('Fetching the latest data...')}</p>

        `
        return loading
      }
      return originalView(state, emit)
    }
  }
}
