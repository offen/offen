/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')
const sinon = require('sinon')
const configureMockStore = require('redux-mock-store').default
const thunk = require('redux-thunk').default

const model = require('./model')

describe('src/action-creators/model.js', function () {
  describe('query()', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'QUERY_SUCCESS', payload: { result: 'fake model' } })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(model.query(null, 'user'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'QUERY',
            payload: { authenticatedUser: 'user' }
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'QUERY_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'QUERY_SUCCESS',
            payload: 'fake model'
          })
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(model.query('query', 'user'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'QUERY',
            payload: {
              authenticatedUser: 'user',
              query: 'query'
            }
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'QUERY_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })

  describe('purge()', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'PURGE_SUCCESS', payload: { result: null } })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(model.purge())
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'PURGE',
            payload: null
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'PURGE_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'PURGE_SUCCESS',
            payload: null
          })
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(model.purge())
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'PURGE',
            payload: null
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'PURGE_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })
})
