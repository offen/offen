var choo = require('choo')

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
      consent(app.state, app.emitter)

      app.emitter.on('offen:query', function () {
        done()
      })
      app.emitter.on(app.state.events.RENDER, function () {
        done(new Error('Unexpected render call'))
      })

      app.emitter.emit('offen:consent', true)
    })
  })
})
