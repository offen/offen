const assert = require('assert')
const sinon = require('sinon')
const configureMockStore = require('redux-mock-store').default
const thunk = require('redux-thunk').default

const management = require('./management')

describe('src/action-creators/management.js', function () {
  describe('shareAccount(payload, onSuccessMessage, onFailureMessage)', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'SHARE_ACCOUNT_SUCCESS', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})
      return store.dispatch(management.shareAccount('user-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'SHARE_ACCOUNT',
            payload: 'user-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'SHARE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'SHARE_ACCOUNT_SUCCESS',
            payload: {
              flash: 'on-success'
            }
          })
        })
    })

    it('handles unsuccessful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'SHARE_ACCOUNT_FAILURE', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})
      return store.dispatch(management.shareAccount('user-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'SHARE_ACCOUNT',
            payload: 'user-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'SHARE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'SHARE_ACCOUNT_FAILURE',
            payload: {
              flash: 'on-failure'
            }
          })
        })
    })

    it('handles unknown actions', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'ZALGO_ACTION', payload: 'boo!' })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(management.shareAccount('user-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'SHARE_ACCOUNT',
            payload: 'user-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'SHARE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(management.shareAccount('user-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'SHARE_ACCOUNT',
            payload: 'user-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'SHARE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })

  describe('join(update, onSuccessMessage, onFailureMessage)', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'JOIN_SUCCESS', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})
      return store.dispatch(management.join('join-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'JOIN',
            payload: 'join-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'JOIN_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'JOIN_SUCCESS',
            payload: {
              flash: 'on-success'
            }
          })
        })
    })

    it('handles unsuccessful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'JOIN_FAILURE', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})
      return store.dispatch(management.join('join-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'JOIN',
            payload: 'join-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'JOIN_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'JOIN_FAILURE',
            payload: {
              flash: 'on-failure'
            }
          })
        })
    })

    it('handles unknown actions', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'ZALGO_ACTION', payload: 'boo!' })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(management.join('join-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'JOIN',
            payload: 'join-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'JOIN_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(management.join('join-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'JOIN',
            payload: 'join-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'JOIN_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })

  describe('createAccount(payload, onSuccessMessage, onFailureMessage)', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'CREATE_ACCOUNT_SUCCESS', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})
      return store.dispatch(management.createAccount('create-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'CREATE_ACCOUNT',
            payload: 'create-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'CREATE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'CREATE_ACCOUNT_SUCCESS',
            payload: {
              flash: 'on-success'
            }
          })
        })
    })

    it('handles unsuccessful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'CREATE_ACCOUNT_FAILURE', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})
      return store.dispatch(management.createAccount('create-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'CREATE_ACCOUNT',
            payload: 'create-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'CREATE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'CREATE_ACCOUNT_FAILURE',
            payload: {
              flash: 'on-failure'
            }
          })
        })
    })

    it('handles unknown actions', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'ZALGO_ACTION', payload: 'boo!' })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(management.createAccount('create-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'CREATE_ACCOUNT',
            payload: 'create-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'CREATE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(management.createAccount('create-data', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'CREATE_ACCOUNT',
            payload: 'create-data'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'CREATE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })

  describe('retireAccount(payload, onSuccessMessage, onFailureMessage)', function () {
    it('handles successful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'RETIRE_ACCOUNT_SUCCESS', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})
      return store.dispatch(management.retireAccount('account-id', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'RETIRE_ACCOUNT',
            payload: 'account-id'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'RETIRE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'RETIRE_ACCOUNT_SUCCESS',
            payload: {
              flash: 'on-success'
            }
          })
        })
    })

    it('handles unsuccessful responses', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'RETIRE_ACCOUNT_FAILURE', payload: null })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})
      return store.dispatch(management.retireAccount('account-id', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'RETIRE_ACCOUNT',
            payload: 'account-id'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'RETIRE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'RETIRE_ACCOUNT_FAILURE',
            payload: {
              flash: 'on-failure'
            }
          })
        })
    })

    it('handles unknown actions', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({ type: 'ZALGO_ACTION', payload: 'boo!' })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(management.retireAccount('account-id', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'RETIRE_ACCOUNT',
            payload: 'account-id'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'RETIRE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(management.retireAccount('account-id', 'on-success', 'on-failure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'RETIRE_ACCOUNT',
            payload: 'account-id'
          }))

          assert.deepStrictEqual(actions[0], {
            type: 'RETIRE_ACCOUNT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')
        })
    })
  })
})
