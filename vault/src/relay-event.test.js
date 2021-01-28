/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')

const relayEventWith = require('./relay-event').relayEventWith

describe('src/relay-event.js', function () {
  describe('relayEvent(accountId, event)', function () {
    let userSecret
    beforeEach(function () {
      return window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      )
        .then(function (key) {
          return window.crypto.subtle.exportKey('jwk', key)
        }).then(function (_userSecret) {
          userSecret = _userSecret
        })
    })

    function mockEnsureUserSecret () {
      return Promise.resolve(userSecret)
    }

    it('sends an augmented and encrypted event payload to the server', function (done) {
      let err
      const mockApi = {
        postEvent: function (accountId, payload) {
          try {
            assert(payload)
            assert.notStrictEqual(payload, 'data')
            assert.strictEqual(accountId, 'account-id-token')
          } catch (_err) {
            err = _err
          }
          return Promise.resolve()
        }
      }
      const relayEvent = relayEventWith(mockApi, mockEnsureUserSecret)
      relayEvent('account-id-token', { payload: 'data' })
        .then(function () {
          done(err)
        })
    })

    it('retries on a 400 error', function () {
      let numCalled = 0
      const mockApi = {
        postEvent: function (event) {
          numCalled++
          if (numCalled === 1) {
            const err = new Error('bad request')
            err.status = 400
            return Promise.reject(err)
          }
          return Promise.resolve()
        }
      }
      const relayEvent = relayEventWith(mockApi, mockEnsureUserSecret)
      return relayEvent('account-id-token', { payload: 'data' })
        .then(function () {
          assert.strictEqual(numCalled, 2)
        })
    })

    it('rejects on api failing', function (done) {
      const mockApi = {
        postEvent: function (event) {
          return Promise.reject(new Error('Does not work.'))
        }
      }
      const relayEvent = relayEventWith(mockApi, mockEnsureUserSecret)
      relayEvent('account-id-token', { payload: 'data' })
        .then(function () {
          done(new Error('Unexpected Promise resolution'))
        })
        .catch(function () {
          done()
        })
    })
  })
})
