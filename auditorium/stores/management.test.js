var assert = require('assert')
var choo = require('choo')

var management = require('./management')

describe('stores/management.js', function () {
  describe('management(state, emitter)', function () {
    var app
    beforeEach(function () {
      app = choo()
      app.state.query = {}
      app._setCache(app.state)
    })

    // It is important to run these tests in the defined order as otherwise
    // the fixture responses in the mock vault will not match the test cases.
    it('handles user invitation', function (done) {
      management(app.state, app.emitter)

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.strictEqual(app.state.flash, 'yes')
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:invite-user', null, 'yes', 'no')
    })

    it('handles join requests', function (done) {
      management(app.state, app.emitter)
      app.state.authenticatedUser = {}

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.strictEqual(app.state.flash, 'yes')
          assert.strictEqual(app.state.authenticatedUser, null)
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:join', null, 'yes', 'no')
    })

    it('handles account creation', function (done) {
      management(app.state, app.emitter)
      app.state.authenticatedUser = {}

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.strictEqual(app.state.flash, 'yes')
          assert.strictEqual(app.state.authenticatedUser, null)
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:create-account', null, 'yes', 'no')
    })
  })
})
