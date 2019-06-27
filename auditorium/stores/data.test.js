var assert = require('assert')
var choo = require('choo')

var data = require('./data')

describe('stores/data.js', function () {
  describe('data(state, emitter)', function () {
    var app
    beforeEach(function () {
      app = choo()
      app.state.query = {}
      app._setCache(app.state)
    })

    it('passes through data received by the vault to the state', function (done) {
      data(app.state, app.emitter)

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.strictEqual(app.state.model.loading, false)
          assert.strictEqual(app.state.model.value, 99)
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:query')
    })
  })
})
