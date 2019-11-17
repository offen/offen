var html = require('choo/html')

module.exports = view

function view (state, emit) {
  var notFoundMessage = html`
    <p data-role="temp" class="error dib pa2 black br2 bg-black-05 mt0 mb2">${__('Not found...')}</p>
  `
  return notFoundMessage
}
