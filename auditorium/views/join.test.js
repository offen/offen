var assert = require('assert')
var choo = require('choo')

var joinView = require('./join')

describe('views/join.js', function () {
  var app
  beforeEach(function () {
    app = choo()
    app._setCache(app.state)
  })

  describe('joinView', function () {
    it('renders a consent banner', function () {
      app.state.params = { token: 'token' }
      var result = joinView(app.state, app.emit)

      var paragraph = result.querySelectorAll('#consentBanner')
      assert(paragraph)
    })
  })
})
