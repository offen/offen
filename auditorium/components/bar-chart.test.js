var assert = require('assert')

var BarChart = require('./bar-chart')

describe('components/bar-chart.js', function () {
  describe('BarChart', function () {
    it('renders a bar chart', function () {
      var chart = new BarChart('test-component', { components: {} })
      var el = chart.render()
      assert(el.classList.contains('chart'))
    })
  })
})
