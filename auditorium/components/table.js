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

Table.prototype.createElement = function (tableSets, onEmptyMessage) {
  var self = this
  if (!Array.isArray(tableSets)) {
    tableSets = [tableSets]
  }
  var selected = tableSets[this.selected]
  var rows = Array.isArray(selected.rows) && selected.rows.length
    ? selected.rows.map(function (row) {
      return html`
        <tr class="striped--near-white">
          <td class="truncate pv2 ph1">
            ${row.key}
          </td>
          <td class="pv2 ph1">
            ${row.count}
          </td>
        </tr>
      `
    })
    : html`<tr><td colspan="2">${onEmptyMessage}</td></tr>`

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
    <div class="nowrap overflow-x-auto">
      <div>
        ${headlines}
      </div>
      <table class="collapse dt--fixed mb3">
        <thead>
          <tr>
            <th class="w-70 tl b pv2 ph1">
              ${selected.col1Label}
            </th>
            <th class="w-30 tl b pv2 ph1">
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
