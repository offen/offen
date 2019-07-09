var html = require('choo/html')

module.exports = view

function view (state, emit) {
  var notFoundMessage = html`
    <h2>Not found...</h2>
  `
  return notFoundMessage
}
