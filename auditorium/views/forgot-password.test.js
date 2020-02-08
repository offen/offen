var assert = require('assert')
var choo = require('choo')

var forgotPasswordView = require('./forgot-password')

describe('views/forgot-password.js', function () {
  var app
  beforeEach(function () {
    app = choo()
    app.state.params = {}
    app._setCache(app.state)
  })

  describe('forgotPasswordView', function () {
    it('renders a form', function () {
      var result = forgotPasswordView(app.state, app.emit)

      var paragraph = result.querySelectorAll('form')
      assert(paragraph)
    })
  })
})
