var assert = require('assert')

var cookies = require('./cookie-tools')

describe('src/cookie-tools.js', function () {
  describe('cookies.serialize(obj)', function () {
    it('serializes an object', function () {
      var result = cookies.serialize({ ok: 'yes', other: 1 })
      assert.strictEqual(result, 'ok=yes; other=1')
    })

    it('handles boolean flags correctly', function () {
      var result1 = cookies.serialize({ ok: 'yes', Secure: true })
      assert.strictEqual(result1, 'ok=yes; Secure')
      var result2 = cookies.serialize({ ok: 'yes', Secure: false })
      assert.strictEqual(result2, 'ok=yes')
    })
  })
  describe('cookies.parse(cookieString)', function () {
    it('parses key value pairs into an object', function () {
      var result = cookies.parse('ok=yes; other=1')
      assert.deepStrictEqual(result, { ok: 'yes', other: '1' })
    })
  })
})
