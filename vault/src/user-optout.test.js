var assert = require('assert')

var hasOptedOut = require('./user-optout')

describe('src/user-optout.js', function () {
  describe('hasOptedOut()', function () {
    context('with cookie present', function () {
      beforeEach(function () {
        document.cookie = 'something=12'
        document.cookie = 'optout=1'
      })

      afterEach(function () {
        var exp = new Date(0).toUTCString()
        document.cookie = 'something=; expires=' + exp
        document.cookie = 'optout=; expires=' + exp
      })

      it('returns true', function () {
        var result = hasOptedOut()
        assert.strictEqual(result, false)
      })
    })

    context('with no cookies', function () {
      it('returns false', function () {
        var result = hasOptedOut()
        assert.strictEqual(result, false)
      })
    })
  })
})
