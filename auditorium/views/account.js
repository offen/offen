var html = require('choo/html')

var layout = require('./_layout')

module.exports = view

function view (state, emit) {
  var loggedInMessage = html`
    <p>
      You are now logged in.<br>
      For now, please navigate by entering a URL manually.
    </p>
  `
  return layout(loggedInMessage)
}
