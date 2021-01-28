/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')
const checkSupport = require('./check-support')

describe('src/check-support.js', function () {
  describe('checkSupport(callback)', function () {
    it('passes when run in chromium', function (done) {
      checkSupport(function (err) {
        assert.strictEqual(err, null)
        done()
      })
    })

    it('calls the callback asynchronously', function (done) {
      let called = false
      function callback () {
        called = true
        done()
      }
      checkSupport(callback)
      assert.strictEqual(called, false)
    })
  })
})
