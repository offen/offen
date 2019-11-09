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
          </div>
          <div class="row"></div>
            ${flash ? html`>
              <div class="row">
                <div class="flash-message">${flash}</div>
              </div>
            ` : null}
          ${originalView(state, emit)}
        </div>
      `
    }
  }
}
