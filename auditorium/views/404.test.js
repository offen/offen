var assert = require('assert')
var choo = require('choo')

var notFoundView = require('./404')

describe('views/404.js', function () {
  var app
  beforeEach(function () {
    app = choo()
  })

  describe('notFoundView', function () {
    it('renders a not found message', function () {
      var result = notFoundView(app.state, app.emit)
      assert(result.matches('error dib pa2 br2 bg-black-05 mt0 mb2'))
      assert(result.innerText.indexOf('Not found') >= 0)
    })
  })
})
