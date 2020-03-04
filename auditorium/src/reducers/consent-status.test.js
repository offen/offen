const assert = require('assert')

const consentStatus = require('./consent-status')

describe('src/reducers/consent-status.js', function () {
  describe('consentStatus(state, action)', function () {
    it('returns the initial state', function () {
      const next = consentStatus(undefined, {})
      assert.strictEqual(next, null)
    })

    it('handles NAVIGATE', function () {
      const next = consentStatus({ some: 'thing' }, {
        type: 'NAVIGATE'
      })
      assert.strictEqual(next, null)
    })

    it('handles CONSENT_STATUS_SUCCESS', function () {
      const next = consentStatus({ consentStatus: 'allow' }, {
        type: 'CONSENT_STATUS_SUCCESS',
        payload: {
          consentStatus: 'deny'
        }
      })
      assert.deepStrictEqual(next, { consentStatus: 'deny' })
    })

    it('handles EXPRESS_CONSENT_SUCCESS', function () {
      const next = consentStatus(null, {
        type: 'EXPRESS_CONSENT_SUCCESS',
        payload: {
          consentStatus: 'allow'
        }
      })
      assert.deepStrictEqual(next, { consentStatus: 'allow' })
    })
  })
})
