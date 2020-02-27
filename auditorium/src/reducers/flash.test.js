const assert = require('assert')

const flash = require('./flash')

describe('src/reducers/flash.js', function () {
  describe('flash(state, action)', function () {
    it('returns the initial state', function () {
      const next = flash(undefined, {})
      assert.strictEqual(next, null)
    })

    it('handles NAVIGATE', function () {
      const next = flash('fake state', {
        type: 'NAVIGATE',
        payload: null
      })
      assert.strictEqual(next, null)
    })

    it('handles AUTHENTICATION_FAILURE', function () {
      const next = flash(null, {
        type: 'AUTHENTICATION_FAILURE',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles INVITE_USER_SUCCESS', function () {
      const next = flash(null, {
        type: 'INVITE_USER_SUCCESS',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles INVITE_USER_FAILURE', function () {
      const next = flash(null, {
        type: 'INVITE_USER_FAILURE',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles JOIN_SUCCESS', function () {
      const next = flash(null, {
        type: 'JOIN_SUCCESS',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles JOIN_FAILURE', function () {
      const next = flash(null, {
        type: 'JOIN_FAILURE',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles CREATE_ACCOUNT_SUCCESS', function () {
      const next = flash(null, {
        type: 'CREATE_ACCOUNT_SUCCESS',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles CREATE_ACCOUNT_FAILURE', function () {
      const next = flash(null, {
        type: 'CREATE_ACCOUNT_FAILURE',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles FORM_VALIDATION_ERROR', function () {
      const next = flash(null, {
        type: 'FORM_VALIDATION_ERROR',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles FORGOT_PASSWORD_SUCCESS', function () {
      const next = flash(null, {
        type: 'FORGOT_PASSWORD_SUCCESS',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles FORGOT_PASSWORD_FAILURE', function () {
      const next = flash(null, {
        type: 'FORGOT_PASSWORD_FAILURE',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles CHANGE_CREDENTIALS_SUCCESS', function () {
      const next = flash(null, {
        type: 'CHANGE_CREDENTIALS_SUCCESS',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles CHANGE_CREDENTIALS_FAILURE', function () {
      const next = flash(null, {
        type: 'CHANGE_CREDENTIALS_FAILURE',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles RESET_PASSWORD_SUCCESS', function () {
      const next = flash(null, {
        type: 'RESET_PASSWORD_SUCCESS',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles RESET_PASSWORD_FAILURE', function () {
      const next = flash(null, {
        type: 'RESET_PASSWORD_FAILURE',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles RETIRE_ACCOUNT_SUCCESS', function () {
      const next = flash(null, {
        type: 'RETIRE_ACCOUNT_SUCCESS',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })

    it('handles RETIRE_ACCOUNT_FAILURE', function () {
      const next = flash(null, {
        type: 'RETIRE_ACCOUNT_FAILURE',
        payload: {
          flash: 'msg'
        }
      })
      assert.strictEqual(next, 'msg')
    })
  })
})
