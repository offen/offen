var assert = require('assert')
var events = require('./events')

describe('src/events.js', function () {
  describe('pageview()', function () {
    it('creates a pageview event', function () {
      var event = events.pageview()
      assert.deepStrictEqual(Object.keys(event), ['type', 'href', 'title', 'referrer', 'pageload'])
      assert.strictEqual(event.type, 'PAGEVIEW')
      assert.strictEqual(typeof event.href, 'string')
      assert.strictEqual(typeof event.title, 'string')
      assert.strictEqual(typeof event.referrer, 'string')
    })
  })
})
