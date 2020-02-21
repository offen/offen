const assert = require('assert')

const errors = require('./errors')

describe('src/action-creators/errors.js', function () {
  describe('formValidation(error)', function () {
    it('creates a form validation error action', function () {
      const action = errors.formValidation(new Error('Not valid!'))
      assert.deepStrictEqual(action, {
        type: 'FORM_VALIDATION_ERROR',
        payload: {
          flash: 'Not valid!'
        }
      })
    })
  })

  describe('unrecoverable(error)', function () {
    it('creates a unrecoverable error action', function () {
      const action = errors.unrecoverable(new Error('Did not work!'))
      assert.strictEqual(action.type, 'UNRECOVERABLE_ERROR')
      assert.strictEqual(action.payload.message, 'Did not work!')
    })
  })
})
