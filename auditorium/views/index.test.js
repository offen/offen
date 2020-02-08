var assert = require('assert')
var choo = require('choo')

var indexView = require('./index')

describe('views/index.js', function () {
  var app
  beforeEach(function () {
    app = choo()
    app.state.params = {}
    app._setCache(app.state)
  })

  describe('indexView', function () {
    it('renders a form', function () {
      var result = indexView(app.state, app.emit)

      var paragraph = result.querySelectorAll('form')
      assert(paragraph)
    })
  })
})
