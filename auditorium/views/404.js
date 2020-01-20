var html = require('choo/html')

module.exports = view

function view (state, emit) {
  var notFoundMessage = html`
    <p data-role="message" class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">${__('Not found...')}</p>
  `
  return notFoundMessage
}
