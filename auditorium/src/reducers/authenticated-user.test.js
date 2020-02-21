const assert = require('assert')

const authenticatedUser = require('./authenticated-user')

describe('src/reducers/authenticated-user.js', function () {
  describe('authenticatedUser(state, action)', function () {
    it('returns the initial state', function () {
      const next = authenticatedUser(undefined, {})
      assert.strictEqual(next, null)
    })

    it('handles AUTHENTICATION_SUCCESS', function () {
      const next = authenticatedUser(null, {
        type: 'AUTHENTICATION_SUCCESS',
        payload: 'fake payload'
      })
      assert.strictEqual(next, 'fake payload')
    })

    it('handles LOGOUT_SUCCESS', function () {
      const next = authenticatedUser('fake state', {
        type: 'LOGOUT_SUCCESS',
        payload: null
      })
      assert.deepStrictEqual(next, null)
    })

    it('handles AUTHENTICATION_FAILURE', function () {
      const next = authenticatedUser('fake state', {
        type: 'AUTHENTICATION_FAILURE',
        payload: null
      })
      assert.deepStrictEqual(next, null)
    })

    it('handles RESET_PASSWORD_SUCCESS', function () {
      const next = authenticatedUser('fake state', {
        type: 'RESET_PASSWORD_SUCCESS',
        payload: null
      })
      assert.deepStrictEqual(next, null)
    })

    it('handles FORGOT_PASSWORD_SUCCESS', function () {
      const next = authenticatedUser('fake state', {
        type: 'FORGOT_PASSWORD_SUCCESS',
        payload: null
      })
      assert.deepStrictEqual(next, null)
    })

    it('handles CHANGE_CREDENTIALS_SUCCESS', function () {
      const next = authenticatedUser('fake state', {
        type: 'CHANGE_CREDENTIALS_SUCCESS',
        payload: null
      })
      assert.deepStrictEqual(next, null)
    })

    it('handles CREATE_ACCOUNT_SUCCESS', function () {
      const next = authenticatedUser('fake state', {
        type: 'CREATE_ACCOUNT_SUCCESS',
        payload: null
      })
      assert.deepStrictEqual(next, null)
    })

    it('handles JOIN_SUCCESS', function () {
      const next = authenticatedUser('fake state', {
        type: 'JOIN_SUCCESS',
        payload: null
      })
      assert.deepStrictEqual(next, null)
    })
  })
})
