var html = require('choo/html')

var layout = require('./../_layout')

module.exports = withModel

function withModel () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.model) {
        emit('offen:query', Object.assign({}, state.params, state.query))
        var loading = html`
          <p class="loading">Fetching the latest data...</p>
        `
        return layout(loading)
      }
      return originalView(state, emit)
    }
  }
}
