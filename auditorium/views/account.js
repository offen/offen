var html = require('choo/html')

var withTitle = require('./decorators/with-title')

module.exports = withTitle(view, 'offen accounts')

function view (state, emit) {
  return html`
    <div class="section-auditorium">
      <h1><strong>offen</strong> auditorium</h1>
      <p>You are now logged in.</p>
    </div>
  `
}
