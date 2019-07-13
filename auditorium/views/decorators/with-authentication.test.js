var assert = require('assert')
var choo = require('choo')
var html = require('choo/html')

var withAuthentication = require('./with-authentication')

function testView (state, emit) {
  return html`
    <div>
      <h1 id="test">TEST CONTENT</h1>
    </div>
  `
}

describe('src/decorators/with-authentication.js', function () {
  describe('withAuthentication()', function () {
    var app
    beforeEach(function () {
      app = choo()
    })

    it('emits a login event and defers rendering of children to the next state change', function (done) {
      var wrappedView = withAuthentication()(testView)
      var numEmitted = 0
      var credentials

      app.emitter.on('offen:login', function (_credentials) {
        setTimeout(function () {
          credentials = _credentials
          numEmitted++
          app.state.authenticatedUser = { id: 'some-user-id' }
          result = wrappedView(app.state, app.emit)
        }, 0)
      })

      var result = wrappedView(app.state, app.emit)
      assert.strictEqual(result.querySelector('#test'), null)

      setTimeout(function () {
        var error
        try {
          assert.deepStrictEqual(app.state.authenticatedUser, { id: 'some-user-id' })
          assert.strictEqual(numEmitted, 1)
          assert.strictEqual(credentials, null)
          assert(result.querySelector('#test'))
        } catch (err) {
          error = err
        }
        done(error)
      }, 50)
    })
  })
})
