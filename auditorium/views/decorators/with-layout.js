var html = require('choo/html')
var raw = require('choo/html/raw')

module.exports = withLayout

function withLayout () {
  return function (originalView) {
    return function (state, emit) {
      var flash = state.flash
      state.flash = null
      return html`
        <div class="c">
          <div class="row">
            <h1>${raw(__('<strong>offen</strong> auditorium'))}</h1>
            ${flash ? html`<p class="flash-message">${flash}</p>` : null}
          </div>
          ${originalView(state, emit)}
        </div>
      `
    }
  }
}
