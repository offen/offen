var choo = require('choo')
var assert = require('assert')

var consent = require('./consent')

describe('stores/consent.js', function () {
  describe('consent(state, emitter)', function () {
    var app
    beforeEach(function () {
      app = choo()
      app.state.query = {}
      app._setCache(app.state)
    })

    it('delegates an opt-in request to the vault', function (done) {
      var renderCalled = false
      consent(app.state, app.emitter)

      app.emitter.on(app.state.events.RENDER, function () {
        renderCalled = true
      })

      app.emitter.emit('offen:express-consent', 'allow', 'flash-fixture', function () {
        var error
        try {
          assert(!renderCalled)
          assert.strictEqual(app.state.flash, 'flash-fixture')
        } catch (err) {
          error = err
        }
        done(error)
      })
    })
  })
})
