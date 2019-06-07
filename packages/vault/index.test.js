var assert = require('assert')

var createVault = require('./index')

describe('vault/index.js', function () {
  describe('createVault(host)', function () {
    it('injects a hidden iframe and resolves with a function to post messages', function (done) {
      function handleMessage (event) {
        if (event.data.hey === 'there') {
          finishTest()
          return
        }
        finishTest(new Error('Received unexpected message: ' + JSON.stringify(event.data)))
      }

      function finishTest () {
        window.removeEventListener('message', handleMessage)
        done.apply(null, arguments)
      }

      window.addEventListener('message', handleMessage)

      createVault('http://localhost:9876', true)
        .then(function (postMessage) {
          var iframeElements = document.querySelectorAll('iframe')
          assert.strictEqual(iframeElements.length, 1)

          var vaultElement = iframeElements[0]
          assert.strictEqual(vaultElement.src, 'http://localhost:9876/')

          assert.strictEqual(vaultElement.getAttribute('height'), '0')
          assert.strictEqual(vaultElement.getAttribute('width'), '0')

          assert.strictEqual(typeof postMessage, 'function')
          return postMessage({ please: 'respond' })
        })
        .catch(finishTest)
    })

    it('handles responses when the message contains a `respondWith` key', function () {
      return createVault('http://localhost:9876', true)
        .then(function (postMessage) {
          return postMessage({ value: 12, respondWith: 'respond-token' })
        })
        .then(function (response) {
          assert.deepStrictEqual(response, { value: 12 })
        })
    })
  })
})
