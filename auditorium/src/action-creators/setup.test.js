/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')
const sinon = require('sinon')
const configureMockStore = require('redux-mock-store').default
const thunk = require('redux-thunk').default

const setup = require('./setup')

describe('src/action-creators/setup.js', function () {
  describe('setup()', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'SETUP_SUCCESS', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(setup.setup('payload', 'ok', 'not ok'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'SETUP',
            payload: 'payload'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'SETUP_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'SETUP_SUCCESS',
            payload: {
              flash: 'ok'
            }
          })
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(setup.setup('payload', 'ok', 'not ok'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'SETUP',
            payload: 'payload'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'SETUP_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })

  describe('status()', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'SETUP_STATUS_EMPTY', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(setup.status('not ok'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'SETUP_STATUS',
            payload: null
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'SETUP_STATUS_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'SETUP_STATUS_EMPTY',
            payload: null
          })
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(setup.status('not ok'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'SETUP_STATUS',
            payload: null
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'SETUP_STATUS_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })
})
