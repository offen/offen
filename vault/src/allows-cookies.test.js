var assert = require('assert')

var allowsCookies = require('./allows-cookies')

describe('src/allows-cookies.js', function () {
  describe('allowsCookies()', function () {
    it('returns false in the context of the test setup', function () {
      assert(!allowsCookies())
      assert.strictEqual(document.cookie.indexOf('ok='), -1)
    })
  })
})
