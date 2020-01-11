var html = require('choo/html')
var raw = require('choo/html/raw')

module.exports = withLayout

function withLayout () {
  return function (originalView) {
    return function (state, emit) {
      var flash = state.flash
      state.flash = null
      return html`
        <div data-role="app-host" class="mw8 center pa3 pb5 f5 roboto dark-gray">
          <div id="headline">
            <h1 class="f2 normal mt0 mb4">${raw(__('Offen Auditorium'))}</h1>
            ${flash ? html`
              <p data-role="flash-message" class="dib pa2 br2 bg-black-05 mt0 mb2">${flash}</p>
            ` : null}
          </div>
          ${originalView(state, emit)}
        </div>
      `
    }
  }
}
