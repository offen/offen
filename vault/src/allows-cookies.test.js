/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const allowsCookies = require('./allows-cookies')

describe('src/allows-cookies.js', function () {
  describe('allowsCookies()', function () {
    it('returns false in the context of the test setup', function () {
      assert(!allowsCookies())
      assert.strictEqual(document.cookie.indexOf('ok='), -1)
    })
  })
})
