/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const flash = require('./flash')

describe('src/reducers/flash.js', function () {
  describe('flash(state, action)', function () {
    it('returns the initial state', function () {
      const next = flash(undefined, {})
      assert.deepStrictEqual(next, [])
    })

    it('adds flash messages at the head of the list', function () {
      const next = flash(
        [{ content: 'hey', id: '1' }],
        { type: 'JOIN_SUCCESS', payload: { flash: 'ho', flashId: '2' } }
      )
      assert.deepStrictEqual(next, [
        { content: 'ho', id: '2' },
        { content: 'hey', id: '1' }
      ])
    })

    it('removes flash messages by id', function () {
      const next = flash(
        [
          { content: 'ho', id: '2' },
          { content: 'hey', id: '1' },
          { content: 'lets go', id: '3' }
        ],
        { type: 'EXPIRE_FLASH', payload: { flashId: '1' } }
      )
      assert.deepStrictEqual(next, [
        { content: 'ho', id: '2' },
        { content: 'lets go', id: '3' }
      ])
    })

    it('handles LOGIN_SUCCESS', function () {
      const next = flash(
        [
          { content: 'ho', id: '2' },
          { content: 'hey', id: '1' },
          { content: 'lets go', id: '3' }
        ],
        { type: 'LOGIN_SUCCESS', payload: null }
      )
      assert.deepStrictEqual(next, [])
    })
  })
})
