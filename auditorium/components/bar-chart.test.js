var assert = require('assert')
var choo = require('choo')

var BarChart = require('./bar-chart')

describe('components/bar-chart.js', function () {
  describe('BarChart', function () {
    var app
    beforeEach(function () {
      app = choo()
    })

    it('renders a chartist bar chart', function () {
      var chart = new BarChart('test-component', app.state)
      var el = chart.render()
      assert(el.classList.contains('chart'))
    })
  })
})
