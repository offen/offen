var html = require('choo/html')
var raw = require('choo/html/raw')

module.exports = withLayout

function withLayout () {
  return function (originalView) {
    return function (state, emit) {
      var flash = state.flash
      state.flash = null
      return html`
        <div class="mw7 center pa3 pb5 f5 sans-serif dark-gray">
          <h1 class="f2 normal mt0 mb4">${raw(__('<strong>offen</strong> auditorium'))}</h1>
          ${flash ? html`
            <p class="flash-message dib pa2 black br2 bg-black-05 mt0 mb2">${flash}</p>
          ` : null}
          ${originalView(state, emit)}
        </div>
      `
    }
  }
}
