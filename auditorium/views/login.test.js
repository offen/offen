var assert = require('assert')
var choo = require('choo')

var loginView = require('./login')

describe('views/login.js', function () {
  var app
  var host
  beforeEach(function () {
    app = choo()
    app.state.query = {}
    app._setCache(app.state)

    host = document.createElement('div')
    document.body.appendChild(host)
  })

  afterEach(function () {
    host.parentNode.removeChild(host)
  })

  describe('loginView', function () {
    it('renders a form and emits a login event on its submission', function (done) {
      var result = loginView(app.state, app.emit)
      host.appendChild(result)

      var form = result.querySelector('form')
      assert(form)

      form.querySelector('[name="username"]').value = 'name'
      form.querySelector('[name="password"]').value = 'secret'

      app.emitter.on('offen:login', function (credentials) {
        setTimeout(function () {
          var err
          try {
            assert.strictEqual(credentials.username, 'name')
            assert.strictEqual(credentials.password, 'secret')
          } catch (caught) {
            err = caught
          }
          done(err)
        }, 0)
      })

      setTimeout(function () {
        form.dispatchEvent(new window.Event('submit'))
      }, 7)
    })
  })
})
