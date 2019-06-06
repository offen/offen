var html = require('choo/html')
var Chartist = require('chartist')
var Component = require('choo/component')
var css = require('sheetify')

module.exports = BarChart

function BarChart (id, state) {
  Component.call(this)
  this.local = state.components[id] = {}
  css('chartist/dist/chartist.css')
}

BarChart.prototype = Object.create(Component.prototype)

BarChart.prototype.load = function (element) {
  this.chart = new Chartist.Bar(element, {
    labels: [],
    series: []
  }, {
    reverseData: true,
    horizontalBars: true,
    axisX: {
      onlyInteger: true
    }
  })
}

BarChart.prototype.update = function (data) {
  this.local.data = data
  this.chart.update({
    labels: Object.keys(this.local.data),
    series: [Object.values(this.local.data).map(function (events) { return events.length })]
  })
  return false
}

BarChart.prototype.createElement = function (data) {
  this.local.data = data
  return html`
    <div class="ct-chart ct-golden-section">
    </div>
  `
}
