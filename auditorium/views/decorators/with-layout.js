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
            <div class="12 col">
              <h1>${raw(__('<strong>offen</strong> auditorium'))}</h1>
            </div>
          </div>
          <div class="row">
            <div class="12 col">
              ${flash ? html`<p class="flash-message">${flash}</p>` : null}
            </div>
          </div>
          <div class="row">
            <div class="12 col">
              ${originalView(state, emit)}
            </div>
          </div>
        </div>
      `
    }
  }
}
