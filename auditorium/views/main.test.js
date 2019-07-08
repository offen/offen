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
    it('renders 6 sections when passed data', function () {
      app.state.model = {
        pageviews: [
          { date: '12.12.2019', pageviews: 12 }
        ],
        uniqueAccounts: 2,
        uniqueUsers: 4,
        uniqueSessions: 12,
        bounceRate: 0.5412,
        loading: false,
        referrers: [{}],
        pages: [
          {
            pathname: '/',
            pageviews: 12,
            origin: 'www.puppies.com'
          }
        ]
      }
      app.state.authenticated = true

      var result = mainView(app.state, app.emit)

      var headlines = result.querySelectorAll('h4')
      assert(headlines)
      assert.strictEqual(headlines.length, 6)

      var chart = result.querySelector('.chart')
      assert(chart)
    })
  })
})
