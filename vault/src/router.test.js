/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')
const router = require('./router')

describe('src/router', function () {
  describe('router()', function () {
    let register
    let channel
    beforeEach(function () {
      register = router()
      channel = new window.MessageChannel()
    })
    afterEach(function () {
      register.unbind()
    })
    it('creates a middleware enabled router listening for postMessage events', function (done) {
      register('TEST', function (event, respond, next) {
        respond(event.data.payload)
      })
      channel.port1.onmessage = function (event) {
        assert.strictEqual(event.data, 12)
        done()
      }
      channel.port1.onerror = function (err) {
        done(err)
      }
      window.postMessage({ type: 'TEST', payload: 12 }, '*', [channel.port2])
    })

    it('exits after next has been called with an error', function (done) {
      register('TEST', function (event, respond, next) {
        if (event.data.payload === 12) {
          return next(new Error('Did not work.'))
        }
        next()
      }, function (event, respond, next) {
        done(new Error('Unexpectedly called final handler'))
      })

      channel.port1.onmessage = function (event) {
        let err
        try {
          assert.strictEqual(event.data.type, 'ERROR')
          assert.strictEqual(event.data.payload.error, 'Did not work.')
        } catch (error) {
          err = error
        }
        done(err)
      }
      window.postMessage({ type: 'TEST', payload: 12 }, '*', [channel.port2])
    })
  })
})
