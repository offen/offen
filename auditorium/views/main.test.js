var assert = require('assert')
var choo = require('choo')

var mainView = require('./main')

describe('views/main.js', function () {
  var app
  beforeEach(function () {
    app = choo()
  })

  describe('mainView', function () {
    it('renders a table', function () {
      var result = mainView(app.state, app.emit)
      var table = result.querySelector('table')
      assert(table)
    })
  })
})
