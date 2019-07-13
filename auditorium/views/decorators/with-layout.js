var html = require('choo/html')

module.exports = withLayout

function withLayout () {
  return function (originalView) {
    return function (state, emit) {
      var flash = state.flash
      state.flash = null
      return html`
        <div class="section-auditorium">
          <h1><strong>offen</strong> auditorium</h1>
          ${flash ? html`<p>${flash}</p>` : null}
          ${originalView(state, emit)}
        </div>
      `
    }
  }
}
