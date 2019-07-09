var assert = require('assert')
var choo = require('choo')
var html = require('choo/html')

var withTitle = require('./with-title')

function testView (state, emit) {
  return html`
    <div>
      <h1 id="test">TEST CONTENT</h1>
    </div>
  `
}

describe('src/decorators/with-title.js', function () {
  describe('withTitle()', function () {
    var app
    beforeEach(function () {
      app = choo()
    })

    it('sets the page title to the given value', function () {
      var wrappedView = withTitle('this is a test')(testView)
      wrappedView(app.state, app.emit)
      assert.strictEqual(document.title, 'this is a test')
    })
  })
})
