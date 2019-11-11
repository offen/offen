var html = require('choo/html')
var raw = require('choo/html/raw')

module.exports = withLayout

function withLayout () {
  return function (originalView) {
    return function (state, emit) {
      var flash = state.flash
      state.flash = null
      return html`
        <div class="mw7 center pa3 f5 sans-serif">
          <h1 class="f2 normal mt0 mb4">${raw(__('<strong>offen</strong> auditorium'))}</h1>
          ${flash ? html`
            <p class="flash-message mt0 mb4">${flash}</p>
          ` : null}
          ${originalView(state, emit)}
        </div>
      `
    }
  }
}
