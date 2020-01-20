var html = require('choo/html')

module.exports = withError

function withError () {
  return function (originalView) {
    return function (state, emit) {
      if (state.error) {
        // TODO: do not leak stack trace to users when NODE_ENV equals `production`
        // once things have settled
        var errorMessage = html`
          <p class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">${__('An error occured: %s', state.error.message)}</p>
          <pre>${state.error.stack}</pre>
        `
        return errorMessage
      }
      return originalView(state, emit)
    }
  }
}
