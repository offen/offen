var assert = require('assert')
var choo = require('choo')
var html = require('choo/html')

var withError = require('./with-error')

function testView (state, emit) {
  return html`
    <div>
      <h1 id="test">TEST CONTENT</h1>
    </div>
  `
}

describe('src/decorators/with-error.js', function () {
  describe('withError()', function () {
    var app
    beforeEach(function () {
      app = choo()
    })

    it('passes through the original view when error is not defined', function () {
      var wrappedView = withError()(testView)
      var result = wrappedView(app.state, app.emit)

      assert.strictEqual(result.querySelector('.error'), null)
      assert.strictEqual(result.querySelectorAll('#test').length, 1)
    })

    it('displays an error message instead of the original view when defined on the state', function () {
      var wrappedView = withError()(testView)
      Object.assign(app.state, { error: new Error('did not work') })
      var result = wrappedView(app.state, app.emit)

      assert.strictEqual(result.querySelectorAll('.error').length, 1)
      assert(result.querySelector('.error').innerText.indexOf('did not work') >= 0)
      assert.strictEqual(result.querySelector('#test'), null)
    })
  })
})
