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
      var headline = result.querySelector('h1')
      assert(headline.innerText.indexOf('Not found') >= 0)
    })
  })
})
