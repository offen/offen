var assert = require('assert')

var Table = require('./table')

describe('components/table.js', function () {
  describe('Table', function () {
    it('renders a table out of the given datasets', function () {
      var table = new Table('test-component', { components: {} })
      var el = table.render([
        {
          headline: 'Animals',
          col1Label: 'Type',
          col2Label: 'Count',
          rows: [
            { key: 'Llama', value: 45 },
            { key: 'Frog', value: 12 },
            { key: 'Snake', value: 8 }
          ]
        },
        {
          headline: 'Plants',
          col1Label: 'Type',
          col2Label: 'Count',
          rows: [
            { key: 'Fern', value: 32 },
            { key: 'Tree', value: 12 }
          ]
        }
      ])
      assert.strictEqual(el.querySelectorAll('table').length, 1)
      assert.strictEqual(el.querySelectorAll('tbody tr').length, 3)
      assert.strictEqual(el.querySelector('a[role="button"]').innerText.trim(), 'Animals')
    })
  })
})
