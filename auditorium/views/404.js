var html = require('choo/html')
var layout = require('./_layout')

module.exports = view

function view (state, emit) {
  var notFoundMessage = html`
    <h2>Not found...</h2>
  `
  return layout(notFoundMessage)
}
