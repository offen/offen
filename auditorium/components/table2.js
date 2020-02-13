var html = require('choo/html')
var Component = require('choo/component')

module.exports = Table2

function Table2 (id, state) {
  Component.call(this)
  this.selected = state.components[id] = 0
}

Table2.prototype = Object.create(Component.prototype)

Table2.prototype.update = function (update) {
  return true
}

Table2.prototype.toggle = function (index) {
  this.selected = index
  this.rerender()
}

Table2.prototype.createElement = function (tableSets, onEmptyMessage) {
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
    : html`<tr><td class="pl1 moon-gray" colspan="2">${onEmptyMessage}</td></tr>`

  var headlines = tableSets.map(function (set, index) {
    if (tableSets.length > 1) {
      var css = ['f5', 'normal', 'link', 'dim', 'dib', 'pt2', 'pb3', 'mr3', 'dark-green']
    } else {
      var css = ['f5', 'normal', 'dib', 'pv3']
    }
    var onclick = null
    if (tableSets.length > 1) {
      css.push('pointer')
      onclick = self.toggle.bind(self, index)
    }
    if (index === self.selected && tableSets.length != 1) {
     css.push('b', 'bt', 'bw2', 'b--dark-green')
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
      <div class="nowrap overflow-x-auto mb4">
        <div>
          ${headlines}
        </div>
        <table class="collapse dt--fixed mb2">
          <thead>
            <tr>
              <th class="w-70 normal tl pv2 ph1 moon-gray">
                ${selected.col1Label}
              </th>
              <th class="w-30 normal tl pv2 ph1 moon-gray">
                ${selected.col2Label}
              </th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `
}
