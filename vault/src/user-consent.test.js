var assert = require('assert')

var consentStatus = require('./user-consent')

describe('src/user-consent.js', function () {
  describe('consentStatus()', function () {
    context('with no cookies', function () {
      it('returns null', function () {
        var result = consentStatus()
        assert.strictEqual(result, null)
      })
    })
  })
})
