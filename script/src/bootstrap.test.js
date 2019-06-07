var assert = require('assert')

var bootstrap = require('./bootstrap')

describe('src/bootstrap.js', function () {
  describe('bootstrap(host, accountId)', function () {
    it('generates a pageview event and sends it to the vault', function (done) {
      function handleMessage (event) {
        try {
          assert.strictEqual(event.data.type, 'EVENT')
          assert.strictEqual(event.data.payload.accountId, 'account-id-token')
          assert.strictEqual(event.data.payload.event.type, 'PAGEVIEW')
          tearDown()
        } catch (err) {
          tearDown(err)
        }
      }
      window.addEventListener('message', handleMessage)

      function tearDown () {
        done.apply(null, arguments)
        window.removeEventListener('message', handleMessage)
      }

      bootstrap('http://localhost:9876', 'account-id-token')
        .catch(tearDown)
    })
  })
})
