/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const getSessionId = require('./session-id')

describe('src/session-id.js', function () {
  describe('getSessionId(accountId)', function () {
    it('returns unstable values in the context of the test setup', function () {
      const resultA = getSessionId('account-a')
      const resultB = getSessionId('account-a')
      const resultC = getSessionId('account-b')
      assert.notStrictEqual(resultA, resultB)
      assert.notStrictEqual(resultB, resultC)
    })
  })
})
