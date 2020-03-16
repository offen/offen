/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const navigation = require('./navigation')

describe('src/action-creators/navigation.js', function () {
  describe('navigate(url)', function () {
    it('creates a navigation action', function () {
      const action = navigation.navigate('/foo')
      assert.deepStrictEqual(action, {
        type: 'NAVIGATE',
        payload: { url: '/foo' }
      })
    })
  })
})
