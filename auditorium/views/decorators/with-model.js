var html = require('choo/html')

module.exports = withModel

function withModel () {
  return function (originalView) {
    return function (state, emit) {
      if (!state.model) {
        emit('offen:query', Object.assign({}, state.params, state.query), state.authenticatedUser)
        var loading = html`
          <div class="row">
            <p class="loading">${__('Fetching the latest data...')}</p>
          </div>
        `
        return loading
      }
      return originalView(state, emit)
    }
  }
}
