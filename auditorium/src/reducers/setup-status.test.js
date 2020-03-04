const assert = require('assert')

const setupStatus = require('./setup-status')

describe('src/reducers/setup-status.js', function () {
  describe('setupStatus(state, action)', function () {
    it('returns the initial state', function () {
      const next = setupStatus(undefined, {})
      assert.strictEqual(next, null)
    })

    it('handles SETUP_STATUS_EMPTY', function () {
      const next = setupStatus('fake state', {
        type: 'SETUP_STATUS_EMPTY',
        payload: null
      })
      assert.strictEqual(next, 'empty')
    })

    it('handles SETUP_SUCCESS', function () {
      const next = setupStatus('fake state', {
        type: 'SETUP_SUCCESS',
        payload: null
      })
      assert.strictEqual(next, null)
    })
  })
})
