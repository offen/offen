var assert = require('assert')
var router = require('./router')

describe('src/router.js', function () {
  describe('router(vaultUrl)', function () {
    it('exposes a middleware enabled event emitter', function (done) {
      var app = router(process.env.VAULT_HOST)
      app.on('KEY', function (context, send, next) {
        context.other = true
        next()
      }, function (context, send, next) {
        send({
          type: 'TEST',
          payload: context
        }, true)
          .then(function (response) {
            assert.deepStrictEqual(
              response,
              { type: 'TEST', payload: { some: 'value', other: true } }
            )
            done()
          })
          .catch(done)
      })

      app.dispatch('KEY', { some: 'value' })
    })

    it('skips the stack on error', function (done) {
      var app = router(process.env.VAULT_HOST)

      app.on('KEY', function (context, send, next) {
        next(new Error('Do not send'))
      }, function (context, send, next) {
        done(new Error('Unexpectedly called final handler'))
      })

      setTimeout(function () {
        done()
      }, 50)

      app.dispatch('KEY', { some: 'value' })
    })
  })
})
