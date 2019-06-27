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
    it('displays a loading state on first render', function () {
      var result = mainView(app.state, app.emit)
      var headline = result.querySelector('h1')
      assert(headline)

      var loading = result.querySelector('p.loading')
      assert(loading)
    })

    it('emits a query event when no model is set', function () {
      var originalEmit = app.emit
      var callArgs = []
      // sinon broke the dependency tree for unknown reasons so we need
      // to spy on the emit function ourselves right now
      app.emit = function () {
        var args = [].slice.call(arguments)
        callArgs.push(args)
        originalEmit.apply(app, args)
      }
      app.state.params = { query: 'test' }
      mainView(app.state, app.emit)
      assert.strictEqual(callArgs.length, 1)
      assert.strictEqual(callArgs[0][0], 'offen:query')
      assert.deepStrictEqual(callArgs[0][1], { query: 'test' })
    })

    it('renders an error message when an error is defined', function () {
      app.state.model = { error: new Error('did not work') }
      var result = mainView(app.state, app.emit)
      var message = result.querySelector('p.error')
      assert(message)
    })

    it('renders 5 sections when passed data', function () {
      app.state.model = {
        pageviews: [
          { date: '12.12.2019', pageviews: 12 }
        ],
        uniqueAccounts: 2,
        uniqueUsers: 4,
        uniqueSessions: 12,
        loading: false,
        referrers: [],
        pages: [
          {
            pathname: '/',
            pageviews: 12,
            origin: 'www.puppies.com'
          }
        ]
      }
      var result = mainView(app.state, app.emit)

      var headlines = result.querySelectorAll('h4')
      assert(headlines)
      assert.strictEqual(headlines.length, 5)

      var chart = result.querySelector('.ct-chart')
      assert(chart)
    })
  })
})
