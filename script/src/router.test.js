/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var router = require('./router')

describe('src/router.js', function () {
  describe('router(vaultUrl)', function () {
    it('exposes a middleware enabled event emitter', function (done) {
      var app = router(process.env.VAULT_HOST)
      app.on('TEST', function (context, send, next) {
        context.other = true
        next()
      }, function (context, send, next) {
        send({
          type: 'TEST',
          payload: context
        })
          .then(function (response) {
            assert(response.host)
            delete response.host
            assert.deepStrictEqual(
              response,
              { type: 'TEST', payload: { some: 'value', other: true } }
            )
            done()
          })
          .catch(done)
      })

      app.dispatch('TEST', { some: 'value' })
    })

    it('skips the stack on error', function (done) {
      var app = router(process.env.VAULT_HOST)

      var timeout = setTimeout(function () {
        done()
      }, 50)

      app.on('TEST', function (context, send, next) {
        next(new Error('Do not send'))
      }, function (context, send, next) {
        window.clearTimeout(timeout)
        done(new Error('Unexpectedly called final handler'))
      })

      app.dispatch('TEST', { some: 'value' })
    })
  })
})
