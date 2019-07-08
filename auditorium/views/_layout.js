var html = require('choo/html')

module.exports = layout

function layout () {
  var elements = [].slice.call(arguments)
  var withSeparators = elements.map(function (el) {
    return html`${el}<hr>`
  })
  return html`
    <div class="section-auditorium">
      <h1><strong>offen</strong> auditorium</h1>
      ${withSeparators}
    </div>
  `
}
