var assert = require('assert')
var choo = require('choo')
var html = require('choo/html')

var withModel = require('./with-model')

function testView (state, emit) {
  return html`
    <div>
      <h1 id="test">${state.model.value}</h1>
    </div>
  `
}

describe('src/decorators/with-model.js', function () {
  describe('withModel()', function () {
    var app
    beforeEach(function () {
      app = choo()
    })

    it('emits a query event and defers rendering of children to the next state change', function (done) {
      var wrappedView = withModel()(testView)
      var numEmitted = 0

      app.emitter.on('offen:query', function () {
        setTimeout(function () {
          numEmitted++
          app.state.model = { value: 'yes' }
          result = wrappedView(app.state, app.emit)
        }, 0)
      })

      var result = wrappedView(app.state, app.emit)
      assert.strictEqual(result.querySelector('#test'), null)

      setTimeout(function () {
        var error
        try {
          assert.strictEqual(numEmitted, 1)
          assert(result.querySelector('#test'))
          assert.strictEqual(result.querySelector('#test').innerText, 'yes')
        } catch (err) {
          error = err
        }
        done(error)
      }, 50)
    })
  })
})
