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
    x: Object.keys(this.local.data)
      .reverse(),
    y: Object.values(this.local.data)
      .reverse()
      .map(function (events) {
        return events.length
      }),
    marker: { color: '#f9d152' }
  }], {
    yaxis: { dtick: 1, nticks: 5 }
  },
  {
    displayModeBar: false,
    responsive: true
  },
  {
    margin: { l: 0, r: 0, b: 0, t: 0 }
  })
}

BarChart.prototype.createElement = function (data) {
  this.local.data = data
  return html`
    <div class="ct-chart ct-golden-section">
    </div>
  `
}
