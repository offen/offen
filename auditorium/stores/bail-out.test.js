var assert = require('assert')
var choo = require('choo')

var bailOut = require('./bail-out')

describe('stores/bail-out.js', function () {
  describe('bailOut(state, emitter)', function () {
    var app
    beforeEach(function () {
      app = choo()
      app.state.query = {}
      app._setCache(app.state)
    })

    it('sets the given message on the state and re-renders', function (done) {
      bailOut(app.state, app.emitter)

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.deepStrictEqual(app.state.error, { message: 'did not work' })
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:bailOut', 'did not work')
    })
  })
})
