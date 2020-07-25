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
      var mockStorage = {
        getLastKnownCheckpoint: sinon.stub().resolves('sequence-a'),
        updateLastKnownCheckpoint: sinon.stub().resolves(),
        deleteEvents: sinon.stub().resolves(true),
        putEvents: sinon.stub().resolves(true),
        getUserSecret: sinon.stub().resolves(window.crypto.subtle.exportKey('jwk', userSecret))
      }
      var mockQueries = {
        getDefaultStats: sinon.stub().resolves({ mock: 'result' })
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
      var getUserEvents = getUserEventsWith(mockQueries, mockStorage, mockApi)
      return getUserEvents()
        .then(function (result) {
          assert(mockStorage.getLastKnownCheckpoint.calledOnce)
          assert(mockStorage.getLastKnownCheckpoint.calledWith(null))

          assert(mockStorage.deleteEvents.calledOnce)
          assert(mockStorage.deleteEvents.calledWith(null, 'k'))

          assert(mockApi.getEvents.calledOnce)
          assert(mockApi.getEvents.calledWith({ since: 'sequence-a' }))

          assert(mockStorage.getUserSecret.calledOnce)
          assert(mockStorage.getUserSecret.calledWith('account-a'))

          assert(mockStorage.updateLastKnownCheckpoint.calledOnce)
          assert(mockStorage.updateLastKnownCheckpoint.calledWith(null, 'sequence-b'))

          assert(mockStorage.putEvents.calledOnce)
          assert(mockStorage.putEvents.calledWith(
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
