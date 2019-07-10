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
  var chartArgs = this.getChartData()
  Plotly.react.apply(Plotly, [element].concat(chartArgs))
    .then(function (el) {
      self.plot = el
    })
}

BarChart.prototype.update = function (update) {
  Object.assign(this.local, update)
  var chartArgs = this.getChartData()
  Plotly.react.apply(Plotly, [this.plot].concat(chartArgs))
  return false
}

BarChart.prototype.createElement = function (params) {
  params = params || {}
  this.local.data = params.data
  this.local.isOperator = params.isOperator
  return html`
    <div class="chart"></div>
  `
}

BarChart.prototype.getChartData = function () {
  var self = this
  var data = [
    {
      type: 'bar',
      x: self.local.data.map(function (item) {
        return item.date
      }),
      y: self.local.data.map(function (item) {
        return self.local.isOperator
          ? item.visitors
          : item.accounts
      }),
      hoverinfo: 'y',
      marker: { color: '#f9d152' },
      name: self.local.isOperator ? 'Visitors' : 'Accounts'
    },
    {
      type: 'bar',
      x: self.local.data.map(function (item) {
        return item.date
      }),
      y: self.local.data.map(function (item) {
        var deduct = self.local.isOperator
          ? item.visitors
          : item.accounts
        return item.pageviews - deduct
      }),
      text: self.local.data.map(function (item) {
        return item.pageviews
      }),
      hovertemplate: '%{text}<extra></extra>',
      marker: { color: '#39352a' },
      name: 'Pageviews'
    }
  ]

  var layout = {
    yaxis: {
      fixedrange: true,
      dtick: 1,
      nticks: 5,
      automargin: true,
      autotick: true,
      tick0: 0
    },
    xaxis: {
      fixedrange: true,
      automargin: true
    },
    margin: { t: 0, r: 0, b: 0, l: 0 },
    barmode: 'stack',
    showlegend: false
  }

  var config = {
    displayModeBar: false
  }

  return [data, layout, config]
}
