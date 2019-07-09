var html = require('choo/html')

module.exports = withLayout

function withLayout () {
  return function (originalView) {
    return function (state, emit) {
      return html`
        <div class="section-auditorium">
          <h1><strong>offen</strong> auditorium</h1>
          ${originalView(state, emit)}
        </div>
      `
    }
  }
}
