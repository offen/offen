var html = require('choo/html')
var Component = require('choo/component')
var Plotly = require('plotly.js-basic-dist')
var isFirstDayOfMonth = require('date-fns/is_first_day_of_month')
var isWeekend = require('date-fns/is_weekend')
var getISOWeek = require('date-fns/get_iso_week')
var getHours = require('date-fns/get_hours')

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
  Object.assign(this.local, params)
  return html`
    <div class="chart"></div>
  `
}

BarChart.prototype.getChartData = function () {
  var self = this
  var x = self.local.data.map(function (item) {
    return item.date
  })
  var y = self.local.data.map(function (item) {
    return self.local.isOperator
      ? item.visitors
      : item.accounts
  })
  var text = x.map(function (value, index) {
    var date = new Date(value)
    if (self.local.resolution === 'hours') {
      return getHours(date) + ':00'
    }
    if (self.local.resolution === 'weeks') {
      return 'W' + getISOWeek(date)
    }
    if (self.local.resolution === 'months') {
      return date.toLocaleDateString(undefined, { month: 'short' })
    }
    var result = date.toLocaleDateString(undefined, { day: 'numeric' })
    if (index === 0 || isFirstDayOfMonth(date)) {
      result = date.toLocaleDateString(undefined, { month: 'short' }) + ' ' + result
    }
    return result
  })

  var data = [
    {
      type: 'bar',
      x: x,
      y: y,
      hoverinfo: 'y',
      marker: {
        color: x.map(function (date) {
          if (self.local.resolution !== 'days') {
            return '#137752'
          }
          return isWeekend(date) ? '#19A974' : '#137752'
        })
      },
      name: self.local.isOperator ? 'Visitors' : 'Accounts'
    },
    {
      type: 'bar',
      x: x,
      y: self.local.data.map(function (item, index) {
        return item.pageviews - y[index]
      }),
      text: self.local.data.map(function (item) {
        return item.pageviews
      }),
      hovertemplate: '%{text}<extra></extra>',
      marker: {
        color: x.map(function (date) {
          if (self.local.resolution !== 'days') {
            return '#19A974'
          }
          return isWeekend(date) ? '#9eebcf' : '#19A974'
        })
      },
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
      automargin: true,
      tickvals: x,
      ticktext: text
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
