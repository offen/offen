var html = require('choo/html')

module.exports = withLayout

function withLayout () {
  return function (originalView) {
    return function (state, emit) {
      var flash = state.flash
      state.flash = null
      return html`
        <div class="container">
          <div class="row">
            <div class="twelve columns">
              <h1><strong>offen</strong> auditorium</h1>
            </div>
          </div>
          <div class="row">
            <div class="twelve columns">
              ${flash ? html`<p class="flash-message">${flash}</p>` : null}
            </div>
          </div>
          <div class="row">
            <div class="twelve columns">
              ${originalView(state, emit)}
            </div>
          </div>
        </div>
      `
    }
  }
}
