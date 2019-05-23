var assert = require('assert')

var createVault = require('./index')

describe('vault/index.js', function () {
  describe('createVault(host)', function () {
    it('resolves with a function to post messages', function () {
      return createVault()
        .then(function (postMessage) {
          assert.strictEqual(typeof postMessage, 'function')
          return postMessage({ some: 'data' })
        })
    })
  })
})
