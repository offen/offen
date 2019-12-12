var assert = require('assert')
var choo = require('choo')
var html = require('choo/html')

var withPreviousRoute = require('./with-previous-route')

function testView (state, emit) {
  return html`
    <div>
      <h1 id="test">TEST CONTENT</h1>
    </div>
  `
}

describe('src/decorators/with-previous-route.js', function () {
  describe('withPreviousRoute()', function () {
    var app
    beforeEach(function () {
      app = choo()
    })

    it('sets the page title to the given value', function () {
      var wrappedView = withPreviousRoute()(testView)
      app.state.route = 'test'
      app.state.params = { val: 23 }
      wrappedView(app.state, app.emit)
      assert.strictEqual(app.state.previousRoute, 'test')
      assert.deepStrictEqual(app.state.previousParams, { val: 23 })

      app.state.route = 'other'
      app.state.params = {}

      wrappedView(app.state, app.emit)
      assert.strictEqual(app.state.previousRoute, 'other')
      assert.deepStrictEqual(app.state.previousParams, {})
    })
  })
})
