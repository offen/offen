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
  var self = this
  this.plot = Plotly.newPlot(element, [
    {
      type: 'bar',
      x: this.local.data.map(function (item) {
        return item.date
      }),
      y: this.local.data.map(function (item) {
        return self.local.isOperator
          ? item.visitors
          : item.accounts
      }),
      marker: { color: '#f9d152' },
      name: this.local.isOperator ? 'Visitors' : 'Accounts'
    },
    {
      type: 'bar',
      x: this.local.data.map(function (item) {
        return item.date
      }),
      y: this.local.data.map(function (item) {
        var deduct = self.local.isOperator
          ? item.visitors
          : item.accounts
        return item.pageviews - deduct
      }),
      text: this.local.data.map(function (item) {
        return item.pageviews
      }),
      hovertemplate: '%{text}',
      marker: { color: '#39352a' },
      name: 'Pageviews'
    }
  ], {
    yaxis: { dtick: 1, nticks: 5, automargin: true },
    xaxis: { automargin: true },
    margin: { t: 0, r: 0, b: 0, l: 0 },
    barmode: 'stack',
    showlegend: false
  }, {
    displayModeBar: false,
    responsive: true
  })
}

BarChart.prototype.createElement = function (params) {
  params = params || {}
  this.local.data = params.data
  this.local.isOperator = params.isOperator
  return html`
    <div class="chart"></div>
  `
}
