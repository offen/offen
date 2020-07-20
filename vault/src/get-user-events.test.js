/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var sinon = require('sinon')
var Unibabel = require('unibabel').Unibabel

var getUserEventsWith = require('./get-user-events').getUserEventsWith

describe('src/get-user-events', function () {
  describe('getUserEvents', function () {
    var userSecret
    var encryptedPayload

    before(function () {
      var nonce
      return window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      )
        .then(function (_userSecret) {
          userSecret = _userSecret
          nonce = window.crypto.getRandomValues(new Uint8Array(12))
          return window.crypto.subtle.encrypt(
            {
              name: 'AES-GCM',
              iv: nonce,
              length: 128
            },
            userSecret,
            Unibabel.utf8ToBuffer(JSON.stringify({ type: 'TEST', timestamp: 'timestamp-fixture' }))
          )
            .then(function (_encryptedPayload) {
              encryptedPayload = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(_encryptedPayload)) + ' ' + Unibabel.arrToBase64(nonce)
            })
        })
    })

    it('ensures sync and then returns the generated default stats', function () {
      var mockQueries = {
        getDefaultStats: sinon.stub().resolves({ mock: 'result' }),
        getLastKnownCheckpoint: sinon.stub().resolves('sequence-a'),
        updateLastKnownCheckpoint: sinon.stub().resolves(),
        deleteEvents: sinon.stub().resolves(true),
        putEvents: sinon.stub().resolves(true),
        getUserSecret: sinon.stub().resolves(window.crypto.subtle.exportKey('jwk', userSecret))
      }
      var mockApi = {
        getDeletedEvents: sinon.stub().resolves({ eventIds: ['a'] }),
        getEvents: sinon.stub().resolves({
          events: {
            'account-a': [{
              eventId: 'z',
              accountId: 'account-a',
              payload: encryptedPayload
            }]
          },
          deletedEvents: ['k'],
          sequence: 'sequence-b'
        })
      }
      var getUserEvents = getUserEventsWith(mockQueries, mockApi)
      return getUserEvents()
        .then(function (result) {
          assert(mockQueries.getLastKnownCheckpoint.calledOnce)
          assert(mockQueries.getLastKnownCheckpoint.calledWith(null))

          assert(mockQueries.deleteEvents.calledOnce)
          assert(mockQueries.deleteEvents.calledWith(null, 'k'))

          assert(mockApi.getEvents.calledOnce)
          assert(mockApi.getEvents.calledWith({ since: 'sequence-a' }))

          assert(mockQueries.getUserSecret.calledOnce)
          assert(mockQueries.getUserSecret.calledWith('account-a'))

          assert(mockQueries.updateLastKnownCheckpoint.calledOnce)
          assert(mockQueries.updateLastKnownCheckpoint.calledWith(null, 'sequence-b'))

          assert(mockQueries.putEvents.calledOnce)
          assert(mockQueries.putEvents.calledWith(
            null,
            {
              eventId: 'z',
              secretId: 'local',
              accountId: 'account-a',
              payload: { type: 'TEST', timestamp: 'timestamp-fixture' }
            }
          ))

          assert(mockQueries.getDefaultStats.calledOnce)
          assert(mockQueries.getDefaultStats.calledWith(null))
          assert.deepStrictEqual(result, { mock: 'result' })
        })
    })
  })
})
