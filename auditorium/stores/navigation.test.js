var assert = require('assert')
var choo = require('choo')

var navigation = require('./navigation')

describe('stores/navigation.js', function () {
  describe('navigation(state, emitter)', function () {
    var app
    beforeEach(function () {
      app = choo()
      app.state.query = {}
      app.state.model = 'some value'
      app.state.interval = 11
      app.state.consentStatus = 'another value'
      app.state.route = 'one'
      app.state.previousRoute = 'zero'
      app._setCache(app.state)
    })

    it('removes model data from the app state', function (done) {
      navigation(app.state, app.emitter)
      app.emitter.emit(app.state.events.NAVIGATE)
      setTimeout(function () {
        var error
        try {
          assert('query' in app.state)
          assert(!('model' in app.state))
          assert(!('interval' in app.state))
          assert(!('consentStatus' in app.state))
          assert(!app.state.stale)
        } catch (err) {
          error = err
        }
        done(error)
      }, 0)
    })

    it('does not delete the model if the route did not change', function (done) {
      navigation(app.state, app.emitter)
      app.state.previousRoute = 'one'
      app.emitter.emit(app.state.events.NAVIGATE)
      setTimeout(function () {
        var error
        try {
          assert('query' in app.state)
          assert('model' in app.state)
          assert('interval' in app.state)
          assert('consentStatus' in app.state)
          assert(app.state.stale)
        } catch (err) {
          error = err
        }
        done(error)
      }, 0)
    })
  })
})
