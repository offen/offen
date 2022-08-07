/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const extensionData = require('./extension-data')

describe('src/reducers/extension-data.js', function () {
  describe('extensionData(state, action)', function () {
    it('returns the initial state', function () {
      const next = extensionData(undefined, {})
      assert.strictEqual(next, null)
    })

    it('handles SETUP_STATUS_EMPTY', function () {
      const next = extensionData(null, {
        type: 'SET_EXTENSION_DATA',
        payload: {
          some: 'thing'
        }
      })
      assert.deepStrictEqual(next, { some: 'thing' })

      const next2 = extensionData({ some: 'thing' }, {
        type: 'SET_EXTENSION_DATA',
        payload: {
          other: { foo: 'bar' }
        }
      })
      assert.deepStrictEqual(next2, { some: 'thing', other: { foo: 'bar' } })
    })
  })
})
