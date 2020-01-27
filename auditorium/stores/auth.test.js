var assert = require('assert')
var choo = require('choo')

var auth = require('./auth')

describe('stores/auth.js', function () {
  describe('auth(state, emitter)', function () {
    var app
    beforeEach(function () {
      app = choo()
      app.state.query = {}
      app._setCache(app.state)
    })

    // It is important to run these tests in the defined order as otherwise
    // the fixture responses in the mock vault will not match the test cases.
    it('authenticates the state if existing auth is still valid', function (done) {
      auth(app.state, app.emitter)

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.deepStrictEqual(app.state.authenticatedUser, { user: { accountUserId: 'some-id' } })
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:login', null)
    })

    it('redirects to the login page when existing auth is not present', function (done) {
      auth(app.state, app.emitter)

      var pushedState
      app.emitter.on(app.state.events.PUSHSTATE, function (route) {
        pushedState = route
      })

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.ok(!app.state.authenticated)
          assert.ok(!app.state.error)
          assert.strictEqual(pushedState, '/login/')
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:login', null, null)
    })

    it('errors the state on a non-auth related failure', function (done) {
      auth(app.state, app.emitter)

      var pushedState
      app.emitter.on(app.state.events.PUSHSTATE, function (route) {
        pushedState = route
      })

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.ok(!app.state.authenticated)
          assert.ok(!pushedState)
          assert.ok(app.state.error)
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:login', null, null)
    })
  })
})
