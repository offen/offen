var assert = require('assert')
var sinon = require('sinon')
var Unibabel = require('unibabel').Unibabel

var getOperatorEventsWith = require('./get-operator-events').getOperatorEventsWith

describe('src/get-operator-events', function () {
  describe('getOperatorEvents', function () {
    context('with no pending events', function () {
      it('syncs the database and returns stats plus account info', function () {
        var mockQueries = {
          getDefaultStats: sinon.stub().resolves({ mock: 'result' }),
          getAllEventIds: sinon.stub().resolves(['a', 'b', 'c', 'd']),
          getLatestEvent: sinon.stub().resolves({ eventId: 'd' }),
          deleteEvents: sinon.stub().resolves(true),
          putEvents: sinon.stub().resolves(true)
        }
        var mockApi = {
          getDeletedEvents: sinon.stub().resolves({ eventIds: ['a'] }),
          getAccount: sinon.stub().resolves({ events: {}, name: 'test', accountId: 'account-a' })
        }
        var getOperatorEvents = getOperatorEventsWith(mockQueries, mockApi)
        return getOperatorEvents({ accountId: 'account-a' })
          .then(function (result) {
            assert.deepStrictEqual(result, {
              mock: 'result',
              account: {
                name: 'test',
                accountId: 'account-a'
              }
            })
          })
      })
    })

    context('with pending events', function () {
      var userSecret
      var encryptedUserSecret
      var accountKey
      var accountJWK
      var userJWK
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
          })
          .then(function (_encryptedPayload) {
            encryptedPayload = Unibabel.arrToBase64(new Uint8Array(_encryptedPayload))
            return window.crypto.subtle.exportKey('jwk', userSecret)
          })
          .then(function (_userJWK) {
            userJWK = _userJWK
            return window.crypto.subtle.generateKey(
              {
                name: 'RSA-OAEP',
                modulusLength: 2048,
                publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
                hash: { name: 'SHA-256' }
              },
              true,
              ['encrypt', 'decrypt']
            )
          })
          .then(function (_accountKey) {
            accountKey = _accountKey
            return window.crypto.subtle.exportKey('jwk', accountKey.privateKey)
          })
          .then(function (_accountJWK) {
            accountJWK = _accountJWK
            return window.crypto.subtle.encrypt(
              {
                name: 'RSA-OAEP'
              },
              accountKey.publicKey,
              Unibabel.utf8ToBuffer(JSON.stringify(userJWK))
            )
          })
          .then(function (encrypted) {
            encryptedUserSecret = Unibabel.arrToBase64(new Uint8Array(encrypted))
          })
      })

      it('syncs the database and returns stats plus account info', function () {
        var mockQueries = {
          getDefaultStats: sinon.stub().resolves({ mock: 'result' }),
          getAllEventIds: sinon.stub().resolves(['a', 'b', 'c', 'd']),
          getLatestEvent: sinon.stub().resolves({ eventId: 'd' }),
          deleteEvents: sinon.stub().resolves(true),
          putEvents: sinon.stub().resolves(true)
        }
        var mockApi = {
          getDeletedEvents: sinon.stub().resolves({ eventIds: ['a'] }),
          getAccount: sinon.stub().resolves({
            events: {
              'account-a': [{
                eventId: 'z',
                userId: 'user-a',
                accountId: 'account-a',
                payload: encryptedPayload
              }]
            },
            name: 'test',
            userSecrets: {
              'user-a': encryptedUserSecret
            },
            accountId: 'account-a',
            encryptedPrivateKey: 'ENCRYPTED_PRIVATE_KEY'
          }),
          decryptPrivateKey: sinon.stub().resolves({ decrypted: accountJWK })
        }
        var getOperatorEvents = getOperatorEventsWith(mockQueries, mockApi)
        return getOperatorEvents({ accountId: 'account-a' })
          .then(function (result) {
            assert(mockQueries.getAllEventIds.calledOnce)
            assert(mockQueries.getAllEventIds.calledWith('account-a'))

            assert(mockQueries.getLatestEvent.calledOnce)
            assert(mockQueries.getLatestEvent.calledWith('account-a'))

            assert(mockApi.getDeletedEvents.calledOnce)
            assert(mockApi.getDeletedEvents.calledWith({ eventIds: ['a', 'b', 'c', 'd'] }))

            assert(mockApi.getAccount.calledOnce)
            assert(mockApi.getAccount.calledWith('account-a'))

            assert(mockApi.decryptPrivateKey.calledOnce)
            assert(mockApi.decryptPrivateKey.calledWith('ENCRYPTED_PRIVATE_KEY'))

            assert(mockQueries.deleteEvents.calledOnce)
            assert(mockQueries.deleteEvents.calledWith('account-a', 'a'))

            assert(mockQueries.putEvents.calledOnce)
            assert(mockQueries.putEvents.calledWith('account-a', {
              eventId: 'z',
              userId: 'user-a',
              accountId: 'account-a',
              payload: {
                type: 'TEST'
              }
            }))

            assert.deepStrictEqual(result, {
              mock: 'result',
              account: {
                name: 'test',
                accountId: 'account-a'
              }
            })
          })
      })
    })
  })
})
