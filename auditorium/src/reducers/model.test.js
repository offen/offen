const assert = require('assert')

const model = require('./model')

describe('src/reducers/model.js', function () {
  describe('model(state, action)', function () {
    it('returns the initial state', function () {
      const next = model(undefined, {})
      assert.strictEqual(next, null)
    })

    it('handles NAVIGATE', function () {
      const next = model('fake state', {
        type: 'NAVIGATE',
        payload: null
      })
      assert.strictEqual(next, null)
    })

    it('handles QUERY_SUCCESS', function () {
      const next = model('fake state', {
        type: 'QUERY_SUCCESS',
        payload: 'fake update'
      })
      assert.strictEqual(next, 'fake update')
    })

    it('handles PURGE_SUCCESS', function () {
      const next = model('fake state', {
        type: 'PURGE_SUCCESS',
        payload: 'fake update'
      })
      assert.strictEqual(next, 'fake update')
    })
  })
})
