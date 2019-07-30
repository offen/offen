var choo = require('choo')

var optOut = require('./opt-out')

describe('stores/opt-out.js', function () {
  describe('optOut(state, emitter)', function () {
    var app
    beforeEach(function () {
      app = choo()
      app.state.query = {}
      app._setCache(app.state)
    })

    it('delegates an opt-out request to the vault', function (done) {
      optOut(app.state, app.emitter)

      app.emitter.on('offen:query', function () {
        done()
      })
      app.emitter.on(app.state.events.RENDER, function () {
        done(new Error('Unexpected render call'))
      })

      app.emitter.emit('offen:optout', true)
    })
  })
})
