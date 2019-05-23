var html = require('choo/html')

var withTitle = require('./decorators/with-title')

module.exports = withTitle(view, 'Not found - offen')

function view (state, emit) {
  return html`
    <div class="container">
      <h1>Not found...</h1>
    </div>
  `
}
