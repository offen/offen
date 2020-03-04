const assert = require('assert')
const sinon = require('sinon')
const configureMockStore = require('redux-mock-store').default
const thunk = require('redux-thunk').default

const authentication = require('./authentication')

describe('src/action-creators/authentication.js', function () {
  describe('login(username, password, onFailureMessage)', function () {
    it('handles successful responses on logging in with credentials', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'LOGIN_SUCCESS',
        payload: 'fake login result'
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.login('me', 'my-password', 'failure message'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 3)

          assert.deepStrictEqual(actions[0], {
            type: 'AUTHENTICATION_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'AUTHENTICATION_SUCCESS',
            payload: 'fake login result'
          })

          assert.deepStrictEqual(actions[2], {
            type: 'LOGIN_SUCCESS',
            payload: 'fake login result'
          })

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGIN',
            payload: {
              credentials: {
                username: 'me',
                password: 'my-password'
              }
            }
          }))
        })
    })

    it('handles unsuccessful responses on logging in with credentials', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'LOGIN_FAILURE',
        payload: null
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.login('me', 'my-password', 'failure message'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'AUTHENTICATION_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'AUTHENTICATION_FAILURE',
            payload: {
              flash: 'failure message'
            }
          })

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGIN',
            payload: {
              credentials: {
                username: 'me',
                password: 'my-password'
              }
            }
          }))
        })
    })

    it('handles successful responses on logging in without credentials', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'LOGIN_SUCCESS',
        payload: 'fake login result'
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.login(null, null, 'failure message'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'AUTHENTICATION_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'AUTHENTICATION_SUCCESS',
            payload: 'fake login result'
          })

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGIN',
            payload: {
              credentials: null
            }
          }))
        })
    })

    it('handles unsuccessful responses on logging in without credentials', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'LOGIN_FAILURE',
        payload: null
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.login(null, null, 'failure message'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'AUTHENTICATION_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'AUTHENTICATION_FAILURE',
            payload: {
              flash: 'failure message'
            }
          })

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGIN',
            payload: {
              credentials: null
            }
          }))
        })
    })

    it('handles unknown response types', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'ZALGO_ACTION'
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.login('me', 'my-password', 'try again'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'AUTHENTICATION_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGIN',
            payload: {
              credentials: {
                username: 'me',
                password: 'my-password'
              }
            }
          }))
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.login('me', 'my-password', 'try again'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'AUTHENTICATION_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGIN',
            payload: {
              credentials: {
                username: 'me',
                password: 'my-password'
              }
            }
          }))
        })
    })
  })

  describe('logout(onFailureMessage)', function () {
    it('handles successful responses on logging out', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'LOGOUT_SUCCESS',
        payload: null
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.logout('nope'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'LOGOUT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'LOGOUT_SUCCESS',
            payload: null
          })

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGOUT',
            payload: null
          }))
        })
    })

    it('handles unsuccessful responses on logging out', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'LOGOUT_FAILURE',
        payload: null
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.logout('nope'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'LOGOUT_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'LOGOUT_FAILURE',
            payload: {
              flash: 'nope'
            }
          })

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGOUT',
            payload: null
          }))
        })
    })

    it('handles unknown response types', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'ZALGO_ACTION'
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.logout('nope'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'LOGOUT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGOUT',
            payload: null
          }))
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.logout('nope'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'LOGOUT_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'LOGOUT',
            payload: null
          }))
        })
    })
  })

  describe('forgotPassword(update, onSuccessMessage, onFailureMessage)', function () {
    it('handles successfully requesting a password reset', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'FORGOT_PASSWORD_SUCCESS',
        payload: null
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.forgotPassword('update', 'onSuccess', 'onFailure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'FORGOT_PASSWORD_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'FORGOT_PASSWORD_SUCCESS',
            payload: {
              flash: 'onSuccess'
            }
          })

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'FORGOT_PASSWORD',
            payload: 'update'
          }))
        })
    })

    it('handles unsuccessfully requesting a password reset', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'FORGOT_PASSWORD_FAILURE',
        payload: null
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.forgotPassword('update', 'onSuccess', 'onFailure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'FORGOT_PASSWORD_REQUEST',
            payload: null
          })

          assert.deepStrictEqual(actions[1], {
            type: 'FORGOT_PASSWORD_FAILURE',
            payload: {
              flash: 'onFailure'
            }
          })

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'FORGOT_PASSWORD',
            payload: 'update'
          }))
        })
    })

    it('handles unknown response types', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.resolves({
        type: 'ZALGO_ACTION'
      })
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.forgotPassword('update', 'onSuccess', 'onFailure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'FORGOT_PASSWORD_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'FORGOT_PASSWORD',
            payload: 'update'
          }))
        })
    })

    it('handles global errors', function () {
      const mockPostMessage = sinon.stub()
      mockPostMessage.rejects(new Error('Did not work!'))
      const mockStore = configureMockStore([thunk.withExtraArgument(mockPostMessage)])
      const store = mockStore({})

      return store.dispatch(authentication.forgotPassword('update', 'onSuccess', 'onFailure'))
        .then(function () {
          const actions = store.getActions()
          assert.strictEqual(actions.length, 2)

          assert.deepStrictEqual(actions[0], {
            type: 'FORGOT_PASSWORD_REQUEST',
            payload: null
          })

          assert.strictEqual(actions[1].type, 'UNRECOVERABLE_ERROR')
          assert.strictEqual(actions[1].payload.message, 'Did not work!')

          assert(mockPostMessage.calledOnce)
          assert(mockPostMessage.calledWith({
            type: 'FORGOT_PASSWORD',
            payload: 'update'
          }))
        })
    })
  })
})
