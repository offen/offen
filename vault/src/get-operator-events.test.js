/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const assert = require('assert')
const sinon = require('sinon')
const Unibabel = require('unibabel').Unibabel

const getOperatorEventsWith = require('./get-operator-events').getOperatorEventsWith

describe('src/get-operator-events', function () {
  describe('getOperatorEvents', function () {
    context('with no pending events', function () {
      let accountKey
      let keyEncryptionJWK
      let encryptedPrivateKey
      let accountPrivateJWK
      before(function () {
        let keyEncryptionKey
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
          .then(function (_accountKey) {
            accountKey = _accountKey
          })
          .then(function () {
            return window.crypto.subtle.generateKey(
              {
                name: 'AES-GCM',
                length: 256
              },
              true,
              ['encrypt', 'decrypt']
            )
          })
          .then(function (_keyEncryptionKey) {
            keyEncryptionKey = _keyEncryptionKey
            return window.crypto.subtle.exportKey('jwk', keyEncryptionKey)
          })
          .then(function (_keyEncryptionJWK) {
            keyEncryptionJWK = _keyEncryptionJWK
            return window.crypto.subtle.exportKey('jwk', accountKey.privateKey)
          })
          .then(function (_accountPrivateJWK) {
            accountPrivateJWK = _accountPrivateJWK
            const nonce = window.crypto.getRandomValues(new Uint8Array(12))
            return window.crypto.subtle.encrypt(
              {
                name: 'AES-GCM',
                iv: nonce,
                length: 128
              },
              keyEncryptionKey,
              Unibabel.utf8ToBuffer(JSON.stringify(accountPrivateJWK))
            )
              .then(function (encrypted) {
                encryptedPrivateKey = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted)) + ' ' + Unibabel.arrToBase64(new Uint8Array(nonce))
              })
          })
      })

      it('syncs the database and returns stats plus account info', function () {
        const mockStorage = {
          getLastKnownCheckpoint: sinon.stub().resolves('sequence-a'),
          updateLastKnownCheckpoint: sinon.stub().resolves(),
          putEncryptedSecrets: sinon.stub().resolves(),
          getEncryptedSecrets: sinon.stub().resolves([]),
          getAggregationSecret: sinon.stub().resolves('ok'),
          ensureAggregationSecret: sinon.stub().resolves(true),
          deleteEvents: sinon.stub().resolves(true),
          putEvents: sinon.stub().resolves(true)
        }
        const mockQueries = {
          getDefaultStats: sinon.stub().resolves({ mock: 'result' })
        }
        const mockApi = {
          getAccount: sinon.stub().resolves({
            accountId: 'account-a',
            encryptedPrivateKey: encryptedPrivateKey
          })
        }
        const getOperatorEvents = getOperatorEventsWith(mockQueries, mockStorage, mockApi)
        return getOperatorEvents(
          { accountId: 'account-a' },
          {
            accounts: [
              { accountId: 'account-a', keyEncryptionKey: keyEncryptionJWK }
            ]
          }
        )
          .then(function (result) {
            assert.deepStrictEqual(result, {
              mock: 'result',
              account: {
                accountId: 'account-a',
                privateKey: accountPrivateJWK,
                encryptedPrivateKey: encryptedPrivateKey
              }
            })
          })
      })
    })

    context('with pending events', function () {
      let userSecret
      let encryptedUserSecret
      let encryptedEventPayload
      let accountKey
      let userJWK
      let nonce
      let keyEncryptionKey
      let keyEncryptionJWK
      let encryptedPrivateKey

      before(function () {
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
            return window.crypto.subtle.encrypt(
              {
                name: 'RSA-OAEP'
              },
              accountKey.publicKey,
              Unibabel.utf8ToBuffer(JSON.stringify(userJWK))
            )
          })
          .then(function (encrypted) {
            encryptedUserSecret = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted))
          })
          .then(function () {
            nonce = window.crypto.getRandomValues(new Uint8Array(12))
            return window.crypto.subtle.encrypt(
              {
                name: 'AES-GCM',
                iv: nonce,
                length: 128
              },
              userSecret,
              Unibabel.utf8ToBuffer(JSON.stringify({ timestamp: 'timestamp-fixture' }))
            )
          })
          .then(function (encrypted) {
            encryptedEventPayload = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted)) + ' ' + Unibabel.arrToBase64(new Uint8Array(nonce))
          })
          .then(function () {
            return window.crypto.subtle.generateKey(
              {
                name: 'AES-GCM',
                length: 256
              },
              true,
              ['encrypt', 'decrypt']
            )
          })
          .then(function (_keyEncryptionKey) {
            keyEncryptionKey = _keyEncryptionKey
            return window.crypto.subtle.exportKey('jwk', keyEncryptionKey)
          })
          .then(function (_keyEncryptionJWK) {
            keyEncryptionJWK = _keyEncryptionJWK
            return window.crypto.subtle.exportKey('jwk', accountKey.privateKey)
          })
          .then(function (accountPrivateJWK) {
            const nonce = window.crypto.getRandomValues(new Uint8Array(12))
            return window.crypto.subtle.encrypt(
              {
                name: 'AES-GCM',
                iv: nonce,
                length: 128
              },
              keyEncryptionKey,
              Unibabel.utf8ToBuffer(JSON.stringify(accountPrivateJWK))
            )
              .then(function (encrypted) {
                encryptedPrivateKey = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted)) + ' ' + Unibabel.arrToBase64(new Uint8Array(nonce))
              })
          })
      })

      it('syncs the database and returns stats plus account info', function () {
        const mockStorage = {
          getLastKnownCheckpoint: sinon.stub().resolves('sequence-a'),
          updateLastKnownCheckpoint: sinon.stub().resolves(),
          putEncryptedSecrets: sinon.stub().resolves(),
          getEncryptedSecrets: sinon.stub().resolves([]),
          getAggregationSecret: sinon.stub().resolves('ok'),
          getEventsByIds: sinon.stub().resolves([]),
          getAggregate: sinon.stub().resolves({}),
          putAggregate: sinon.stub().resolves({}),
          deleteAggregate: sinon.stub().resolves(),
          deleteEvents: sinon.stub().resolves(true),
          putEvents: sinon.stub().resolves(true),
          ensureAggregationSecret: sinon.stub().resolves(true)
        }
        const mockQueries = {
          getDefaultStats: sinon.stub().resolves({ mock: 'result' })
        }
        const mockApi = {
          getAccount: sinon.stub().resolves({
            events: {
              'account-a': [{
                eventId: '01BX5ZZKBKACTAV9WEVGEMMVRY',
                secretId: 'user-a',
                payload: encryptedEventPayload
              }]
            },
            secrets: {
              'user-a': encryptedUserSecret
            },
            deletedEvents: ['01BX5ZZKBKACTAV9WEVGEMMVRZ', '01BX5ZZKBKACTAV9WEVGEMMVS0'],
            sequence: 'sequence-b',
            name: 'test',
            accountId: 'account-a',
            encryptedPrivateKey: encryptedPrivateKey
          })
        }
        const getOperatorEvents = getOperatorEventsWith(mockQueries, mockStorage, mockApi)
        return getOperatorEvents(
          { accountId: 'account-a' },
          {
            accounts: [
              { accountId: 'account-a', keyEncryptionKey: keyEncryptionJWK }
            ]
          }
        )
          .then(function (result) {
            assert(mockApi.getAccount.calledOnce)
            assert(mockApi.getAccount.calledWith('account-a'))

            assert(mockStorage.deleteEvents.calledOnce)
            assert(mockStorage.deleteEvents.calledWith('account-a', ['01BX5ZZKBKACTAV9WEVGEMMVRZ', '01BX5ZZKBKACTAV9WEVGEMMVS0']))

            assert(mockStorage.getLastKnownCheckpoint.calledOnce)
            assert(mockStorage.getLastKnownCheckpoint.calledWith('account-a'))

            assert(mockStorage.updateLastKnownCheckpoint.calledOnce)
            assert(mockStorage.updateLastKnownCheckpoint.calledWith('account-a', 'sequence-b'))

            assert(mockStorage.putEvents.calledOnce)
            assert(mockStorage.putEvents.calledWith('account-a', [{
              eventId: '01BX5ZZKBKACTAV9WEVGEMMVRY',
              secretId: 'user-a',
              payload: encryptedEventPayload
            }]))
          })
      })
    })
  })
})
