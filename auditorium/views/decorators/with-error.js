var html = require('choo/html')

var layout = require('./../_layout')

module.exports = withError

function withError () {
  return function (originalView) {
    return function (state, emit) {
      if (state.error) {
        // TODO: do not leak stack trace to users when NODE_ENV equals `production`
        // once things have settled
        var errorMessage = html`
          <p class="error">An error occured: ${state.error.message}</p>
          <pre>${state.error.stack}</pre>
        `
        return layout(errorMessage)
      }
      return originalView(state, emit)
    }
  }
}
