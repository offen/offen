const assert = require('assert')

const navigation = require('./navigation')

describe('src/action-creators/navigation.js', function () {
  describe('navigate(url)', function () {
    it('creates a navigation action', function () {
      const action = navigation.navigate('/foo', true)
      assert.deepStrictEqual(action, {
        type: 'NAVIGATE',
        payload: { url: '/foo', persistFlash: true }
      })
    })
  })
})
