var html = require('choo/html')

module.exports = withError

function withError () {
  return function (originalView) {
    return function (state, emit) {
      if (state.error) {
        // TODO: do not leak stack trace to users when NODE_ENV equals `production`
        // once things have settled
        var errorMessage = html`
          <p class="error dib pa2 black br2 bg-black-05 mt0 mb2">${__('An error occured: %s', state.error.message)}</p>
          <pre>${state.error.stack}</pre>
        `
        return errorMessage
      }
      return originalView(state, emit)
    }
  }
}
