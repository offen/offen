var html = require('choo/html')

module.exports = withLayout

function withLayout (headline) {
  return function (originalView) {
    return function (state, emit) {
      var flash = state.flash
      state.flash = null
      return html`
        <div data-role="app-host" class="f5 roboto dark-gray">
          <div class="w-100 h3 bg-black-05">
            <div class="mw8 center flex ph3 pt2" id="headline">
              <img src="/offen-icon-black.svg" alt="Offen logo" width="37" height="40" class="ma0 mt1 mr3">
              <h1 class="f2 normal ma0 mt1">${headline || __('Offen Auditorium')}</h1>
            </div>
          </div>
          <div class="mw8 center ph0 ph3-ns pb4">
            <div>
              ${flash ? html`
                <p data-role="flash-message" class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">${flash}</p>
              ` : null}
            </div>
            ${originalView(state, emit)}
          </div>
          <div class="mw8 center flex flex-column flex-row-ns justify-between ph3 pb5 moon-gray">
            <div>
              <p class="b ma0 mb1">
                Offen
              </p>
              <p class="ma0 mb1">
               ${__('Transparent web analytics')}
              </p>
              <p class="ma0 mb2">
               ${__('for everyone')}
              </p>
            </div>
            <div>
              <a href="https://www.offen.dev/" class="normal link underline dim moon-gray" target="_blank">www.offen.dev</a>
            </div>
          </div>
        </div>
      `
    }
  }
}
