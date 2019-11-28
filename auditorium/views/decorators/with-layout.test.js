var assert = require('assert')
var choo = require('choo')
var html = require('choo/html')

var withLayout = require('./with-layout')

function testView (state, emit) {
  return html`
    <h2 id="test">TEST CONTENT</h1>
    <h3 id="other">MORE TEST CONTENT</h1>
    <div><span></span></div>
  `
}

describe('src/decorators/with-layout.js', function () {
  describe('withLayout()', function () {
    var app
    beforeEach(function () {
      app = choo()
    })

    it('wraps the given content in the application layout', function () {
      var wrappedView = withLayout()(testView)
      var result = wrappedView(app.state, app.emit)
      assert(result.matches('[data-role="app-host"]'))
      assert(result.querySelector('h1'))
    })

    it('displays a message flashed onto the state exactly once', function () {
      var wrappedView = withLayout()(testView)
      app.state.flash = 'OMG'
      var result = wrappedView(app.state, app.emit)
      assert.strictEqual(result.querySelector('[data-role="flash-message"]').innerText, 'OMG')
      result = wrappedView(app.state, app.emit)
      assert.strictEqual(result.querySelector('[data-role="flash-message"]'), null)
    })
  })
})
