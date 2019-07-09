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
      var wrappedView = withLayout('this is a test')(testView)
      var result = wrappedView(app.state, app.emit)
      assert(result.matches('.section-auditorium'))
      assert(result.querySelector('h1'))
      assert(result.querySelector('h2#test'))
      assert(result.querySelector('h3#other'))
      assert(result.querySelector('div > span'))
    })
  })
})
