var choo = require('choo')

var optIn = require('./opt-in')

describe('stores/opt-in.js', function () {
  describe('optIn(state, emitter)', function () {
    var app
    beforeEach(function () {
      app = choo()
      app.state.query = {}
      app._setCache(app.state)
    })

    it('delegates an opt-in request to the vault', function (done) {
      optIn(app.state, app.emitter)

      app.emitter.on('offen:query', function () {
        done()
      })
      app.emitter.on(app.state.events.RENDER, function () {
        done(new Error('Unexpected render call'))
      })

      app.emitter.emit('offen:optin', true)
    })
  })
})
