var assert = require('assert')
var sinon = require('sinon')
var Unibabel = require('unibabel').Unibabel

var getUserEventsWith = require('./get-user-events').getUserEventsWith

describe('src/get-user-events', function () {
  describe('getUserEvents', function () {
    var userSecret
    var encryptedPayload

    before(function () {
      return window.crypto.subtle.generateKey(
        {
          name: 'AES-CTR',
          length: 256
        },
        true,
        ['encrypt', 'decrypt']
      )
        .then(function (_userSecret) {
          userSecret = _userSecret
          return window.crypto.subtle.encrypt(
            {
              name: 'AES-CTR',
              counter: new Uint8Array(16),
              length: 128
            },
            userSecret,
            Unibabel.utf8ToBuffer(JSON.stringify({ type: 'TEST' }))
          )
            .then(function (_encryptedPayload) {
              encryptedPayload = Unibabel.arrToBase64(new Uint8Array(_encryptedPayload))
            })
        })
    })

    it('ensures sync and then returns the generated default stats', function () {
      var mockQueries = {
        getDefaultStats: sinon.stub().resolves({ mock: 'result' }),
        getAllEventIds: sinon.stub().resolves(['a', 'b', 'c']),
        deleteEvents: sinon.stub().resolves(true),
        getLatestEvent: sinon.stub().resolves({ eventId: 'c' }),
        putEvents: sinon.stub().resolves(true),
        getUserSecret: sinon.stub().resolves(userSecret)
      }
      var mockApi = {
        getDeletedEvents: sinon.stub().resolves({ eventIds: ['a'] }),
        getEvents: sinon.stub().resolves({ events: {
          'account-a': [{
            eventId: 'z',
            accountId: 'account-a',
            payload: encryptedPayload
          }]
        } })
      }
      var getUserEvents = getUserEventsWith(mockQueries, mockApi)
      return getUserEvents()
        .then(function (result) {
          assert(mockQueries.getAllEventIds.calledOnce)
          assert(mockQueries.getAllEventIds.calledWith(null))

          assert(mockApi.getDeletedEvents.calledOnce)
          assert(mockApi.getDeletedEvents.calledWith(['a', 'b', 'c']))

          assert(mockQueries.deleteEvents.calledOnce)
          assert(mockQueries.deleteEvents.calledWith(null, 'a'))

          assert(mockQueries.getLatestEvent.calledOnce)
          assert(mockQueries.getLatestEvent.calledWith(null))

          assert(mockApi.getEvents.calledOnce)
          assert(mockApi.getEvents.calledWith({ since: 'c' }))

          assert(mockQueries.getUserSecret.calledOnce)
          assert(mockQueries.getUserSecret.calledWith('account-a'))

          assert(mockQueries.putEvents.calledOnce)
          assert(mockQueries.putEvents.calledWith(
            null,
            {
              eventId: 'z',
              userId: 'local',
              accountId: 'account-a',
              payload: { type: 'TEST' }
            }
          ))

          assert(mockQueries.getDefaultStats.calledOnce)
          assert(mockQueries.getDefaultStats.calledWith(null))
          assert.deepStrictEqual(result, { mock: 'result' })
        })
    })
  })
})
