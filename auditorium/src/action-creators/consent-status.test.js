/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')
const sinon = require('sinon')
const configureMockStore = require('redux-mock-store').default
const thunk = require('redux-thunk').default

const consentStatus = require('./consent-status')

describe('src/action-creators/consent-status.js', function () {
  describe('get()', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'CONSENT_STATUS_SUCCESS', payload: { consentStatus: 'deny' } })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(consentStatus.get())
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'CONSENT_STATUS',
            payload: null
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'CONSENT_STATUS_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'CONSENT_STATUS_SUCCESS',
            payload: { consentStatus: 'deny' }
          })
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(consentStatus.get())
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'CONSENT_STATUS',
            payload: null
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'CONSENT_STATUS_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })

  describe('express(status)', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'EXPRESS_CONSENT_SUCCESS', payload: { consentStatus: 'allow' } })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(consentStatus.express('allow'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'EXPRESS_CONSENT',
            payload: {
              status: 'allow'
            }
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'EXPRESS_CONSENT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'EXPRESS_CONSENT_SUCCESS',
            payload: { consentStatus: 'allow' }
          })
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(consentStatus.express('allow'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'EXPRESS_CONSENT',
            payload: {
              status: 'allow'
            }
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'EXPRESS_CONSENT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })
})
