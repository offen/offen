var assert = require('assert')
var choo = require('choo')

var accountView = require('./account')

describe('views/account.js', function () {
  var app
  beforeEach(function () {
    app = choo()
    app.state.query = {}
    app.state.authenticatedUser = {
      userId: 'some-user-id',
      accounts: [
        { accountName: 'name-a', accountId: 'some-id-a' },
        { accountName: 'name-b', accountId: 'some-id-b' },
        { accountName: 'name-c', accountId: 'some-id-c' }
      ]
    }
    app._setCache(app.state)
  })

  describe('accountView', function () {
    it('renders a paragraph', function () {
      var result = accountView(app.state, app.emit)

      var paragraph = result.querySelectorAll('p')
      assert(paragraph)
    })
  })
})
