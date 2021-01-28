/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const cookies = require('./cookie-tools')

describe('src/cookie-tools.js', function () {
  describe('cookies.serialize(obj)', function () {
    it('serializes an object', function () {
      const result = cookies.serialize({ ok: 'yes', other: 1 })
      assert.strictEqual(result, 'ok=yes; other=1')
    })

    it('handles boolean flags correctly', function () {
      const result1 = cookies.serialize({ ok: 'yes', Secure: true })
      assert.strictEqual(result1, 'ok=yes; Secure')
      const result2 = cookies.serialize({ ok: 'yes', Secure: false })
      assert.strictEqual(result2, 'ok=yes')
    })
  })
  describe('cookies.parse(cookieString)', function () {
    it('parses key value pairs into an object', function () {
      const result = cookies.parse('ok=yes; other=1')
      assert.deepStrictEqual(result, { ok: 'yes', other: '1' })
    })
  })
})
