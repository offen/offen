var html = require('choo/html')
var Component = require('choo/component')

module.exports = Table

function Table (id, state) {
  Component.call(this)
  this.selected = state.components[id] = 0
}

Table.prototype = Object.create(Component.prototype)

Table.prototype.update = function (update) {
  return true
}

Table.prototype.toggle = function (index) {
  this.selected = index
  this.rerender()
}

Table.prototype.createElement = function (tableSets) {
  var self = this
  if (!Array.isArray(tableSets)) {
    tableSets = [tableSets]
  }
  var selected = tableSets[this.selected]
  var rows = Array.isArray(selected.rows) && selected.rows.length
    ? selected.rows.map(function (row) {
      return html`
        <tr>
          <td class="pv2 bt b--black-10">
            ${row.key}
          </td>
          <td class="pv2 bt b--black-10">
            ${row.count}
          </td>
        </tr>
      `
    })
    : html`<tr><td colspan="2">${__('No data available for this view')}</td></tr>`

  var headlines = tableSets.map(function (set, index) {
    var css = ['f5', 'normal', 'mt0', 'mb3', 'dib', 'mr3']
    var onclick = null
    if (tableSets.length > 1) {
      css.push('pointer')
      onclick = self.toggle.bind(self, index)
    }
    if (index === self.selected) {
      css.push('b')
    }
    var attrs = { class: css.join(' '), onclick: onclick }
    return html`
      <a role="button" ${attrs}>
        ${set.headline}
      </a>
    `
  })

  return html`
    <div>
      <div>
        ${headlines}
      </div>
      <table class="w-100 collapse mb3 dt--fixed">
        <thead>
          <tr>
            <th class="tl pv2 b">
              ${selected.col1Label}
            </th>
            <th class="tl pv2 b">
              ${selected.col2Label}
            </th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `
}
