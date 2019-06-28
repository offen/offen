var html = require('choo/html')
var Component = require('choo/component')

var Plotly = require('plotly.js-basic-dist')

module.exports = BarChart

function BarChart (id, state) {
  Component.call(this)
  this.local = state.components[id] = {}
}

BarChart.prototype = Object.create(Component.prototype)

BarChart.prototype.load = function (element) {
  this.plot = Plotly.newPlot(element, [{
    type: 'bar',
    x: this.local.data.map(function (item) { return item.date }),
    y: this.local.data.map(function (item) { return item.value }),
    marker: { color: '#f9d152' }
  }], {
    yaxis: { dtick: 1, nticks: 5 }
  }, {
    displayModeBar: false,
    responsive: true
  })
}

BarChart.prototype.createElement = function (data) {
  this.local.data = data
  return html`
    <div class="ct-chart ct-golden-section">
    </div>
  `
}
