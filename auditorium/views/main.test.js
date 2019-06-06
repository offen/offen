var assert = require('assert')
var choo = require('choo')

var mainView = require('./main')

describe('views/main.js', function () {
  var app
  beforeEach(function () {
    app = choo()
    app.state.query = {}
    app._setCache(app.state)
  })

  describe('mainView', function () {
    it('renders a headline', function () {
      var result = mainView(app.state, app.emit)
      var headline = result.querySelector('h1')
      assert(headline)
    })
  })
})
