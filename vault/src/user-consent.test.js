/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const consentStatus = require('./user-consent')

describe('src/user-consent.js', function () {
  describe('get()', function () {
    context('with no cookies', function () {
      it('returns null', function () {
        const result = consentStatus.get()
        assert.strictEqual(result, null)
      })
    })
  })
})
