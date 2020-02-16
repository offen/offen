const assert = require('assert')

const stale = require('./stale')

describe('src/reducers/stale.js', function () {
  describe('stale(state, action)', function () {
    it('returns the initial state', function () {
      const next = stale(undefined, {})
      assert.strictEqual(next, false)
    })

    it('handles QUERY_REQUEST', function () {
      const next = stale('fake state', {
        type: 'QUERY_REQUEST',
        payload: null
      })
      assert.strictEqual(next, true)
    })

    it('handles QUERY_SUCCESS', function () {
      const next = stale('fake state', {
        type: 'QUERY_SUCCESS',
        payload: null
      })
      assert.strictEqual(next, false)
    })

    it('handles QUERY_FAILURE', function () {
      const next = stale('fake state', {
        type: 'QUERY_FAILURE',
        payload: null
      })
      assert.strictEqual(next, false)
    })

    it('handles NAVIGATE', function () {
      const next = stale('fake state', {
        type: 'NAVIGATE',
        payload: null
      })
      assert.strictEqual(next, false)
    })
  })
})
