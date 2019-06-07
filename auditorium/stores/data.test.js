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

    it('aggregates response data into a model', function (done) {
      data(app.state, app.emitter)

      app.emitter.on(app.state.events.RENDER, function () {
        try {
          assert.strictEqual(app.state.model.loading, false)
          assert.strictEqual(app.state.model.uniqueUsers, 1)
          assert.strictEqual(app.state.model.uniqueSessions, 2)
          assert.strictEqual(Object.keys(app.state.model.eventsByDate).length, 7)

          var allEvents = Object.values(app.state.model.eventsByDate).reduce(function (acc, next) {
            acc = acc.concat(next)
            return acc
          }, [])
          assert.strictEqual(allEvents.length, 2)
          done()
        } catch (err) {
          done(err)
        }
      })

      app.emitter.emit('offen:query')
    })
  })
})
