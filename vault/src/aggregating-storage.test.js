/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var sinon = require('sinon')
var Unibabel = require('unibabel').Unibabel
var ULID = require('ulid')

var aggregatingStorage = require('./aggregating-storage')

describe('src/aggregating-storage.js', function () {
  describe('AggregatingStorage', function () {
    var privateJwk
    var publicJwk
    var publicKey
    var encrpytedEvents
    var encryptedSecrets
    before(function () {
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
        .then(function (result) {
          publicKey = result.publicKey
          return Promise.all([
            window.crypto.subtle.exportKey('jwk', result.privateKey),
            window.crypto.subtle.exportKey('jwk', result.publicKey)
          ])
        })
        .then(function (results) {
          privateJwk = results[0]
          publicJwk = results[1]

          var userSecretsById = {}
          var userSecrets = ['test-user-1', 'test-user-2']
            .map(function (userId) {
              return window.crypto.subtle
                .generateKey(
                  {
                    name: 'AES-GCM',
                    length: 256
                  },
                  true,
                  ['encrypt', 'decrypt']
                )
                .then(function (userSecret) {
                  userSecretsById[userId] = userSecret
                  return window.crypto.subtle.exportKey('jwk', userSecret)
                })
                .then(function (jwk) {
                  return window.crypto.subtle
                    .encrypt(
                      {
                        name: 'RSA-OAEP'
                      },
                      publicKey,
                      Unibabel.utf8ToBuffer(JSON.stringify(jwk))
                    )
                    .then(function (encrypted) {
                      var value = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted))
                      return {
                        secretId: userId,
                        value: value,
                        type: 'ENCRYPTED_USER_SECRET'
                      }
                    })
                })
            })

          return Promise.all(userSecrets)
            .then(function (_encryptedSecrets) {
              encryptedSecrets = _encryptedSecrets
            })
            .then(function (res) {
              var now = new Date('2019-07-14T10:01:00.000Z')
              var minuteAgo = new Date('2019-07-14T10:00:30.000Z')
              var twoHoursAgo = new Date('2019-07-12T10:15:30.000Z')
              var events = [
                {
                  accountId: 'test-account-1',
                  secretId: 'test-user-1',
                  eventId: ULID.ulid(now.getTime()),
                  timestamp: now.toJSON(),
                  payload: {
                    type: 'PAGEVIEW',
                    href: 'https://www.offen.dev',
                    title: 'Transparent web analytics',
                    sessionId: 'session-id-1',
                    referrer: '',
                    timestamp: now.toJSON(),
                    pageload: null
                  }
                },
                {
                  accountId: 'test-account-1',
                  secretId: 'test-user-2',
                  eventId: ULID.ulid(minuteAgo.getTime()),
                  timestamp: minuteAgo.toJSON(),
                  payload: {
                    type: 'PAGEVIEW',
                    href: 'https://www.offen.dev',
                    title: 'Transparent web analytics',
                    sessionId: 'session-id-1',
                    referrer: '',
                    timestamp: minuteAgo.toJSON(),
                    pageload: null
                  }
                },
                {
                  accountId: 'test-account-1',
                  secretId: 'test-user-2',
                  eventId: ULID.ulid(twoHoursAgo.getTime()),
                  timestamp: twoHoursAgo.toJSON(),
                  payload: {
                    type: 'PAGEVIEW',
                    href: 'https://www.offen.dev',
                    title: 'Transparent web analytics',
                    sessionId: 'session-id-1',
                    referrer: '',
                    timestamp: twoHoursAgo.toJSON(),
                    pageload: null
                  }
                }
              ].map(function (event) {
                var nonce = window.crypto.getRandomValues(new Uint8Array(12))
                return window.crypto.subtle
                  .encrypt(
                    {
                      name: 'AES-GCM',
                      iv: nonce,
                      length: 128
                    },
                    userSecretsById[event.secretId],
                    Unibabel.utf8ToBuffer(JSON.stringify(event.payload))
                  )
                  .then(function (encryptedEventPayload) {
                    event.payload = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encryptedEventPayload)) + ' ' + Unibabel.arrToBase64(nonce)
                    return event
                  })
              })
              return Promise.all(events)
            })
            .then(function (_encryptedEvents) {
              encrpytedEvents = _encryptedEvents
            })
        })
    })

    it('skips aggregation when no account info is given', function () {
      var mockStorage = {
        getAggregationSecret: sinon.stub().resolves(null),
        putAggregationSecret: sinon.stub().resolves(null),
        getRawEvents: sinon.stub().resolves(['ok']),
        getAggregates: sinon.stub().resolves([]),
        getEncryptedSecrets: sinon.stub().resolves(null),
        putAggregate: sinon.stub().resolves(null)
      }
      var storage = new aggregatingStorage.AggregatingStorage(mockStorage)
      return storage.getEvents(null)
        .then(function (result) {
          assert.deepStrictEqual(result, ['ok'])

          assert(!mockStorage.getAggregationSecret.called)
          assert(!mockStorage.putAggregationSecret.called)
          assert(!mockStorage.getAggregates.called)
          assert(!mockStorage.getEncryptedSecrets.called)
          assert(!mockStorage.putAggregate.called)
        })
    })

    it('returns a list of unencrypted events, materializing aggregates when needed', function () {
      var mockStorage = {
        getAggregationSecret: sinon.stub().resolves(null),
        putAggregationSecret: sinon.stub().resolves(null),
        getRawEvents: sinon.stub().resolves(encrpytedEvents),
        getAggregates: sinon.stub().resolves([]),
        getEncryptedSecrets: sinon.stub().resolves(encryptedSecrets),
        putAggregate: sinon.stub().resolves(null)
      }
      var storage = new aggregatingStorage.AggregatingStorage(mockStorage)
      return storage.getEvents({ accountId: 'account-id', publicJwk: publicJwk, privateJwk: privateJwk })
        .then(function (result) {
          assert.strictEqual(result.length, 3)
        })
    })
  })

  describe('ensureAggregationSecret', function () {
    var publicJwk
    var privateJwk
    before(function () {
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
        .then(function (keypair) {
          return Promise.all([
            window.crypto.subtle.exportKey('jwk', keypair.publicKey),
            window.crypto.subtle.exportKey('jwk', keypair.privateKey)
          ])
        })
        .then(function (results) {
          publicJwk = results[0]
          privateJwk = results[1]
        })
    })

    it('rejects when trying to look up an inexistent key without passing keys', function () {
      var mockStorage = {
        getAggregationSecret: sinon.stub().resolves(null),
        putAggregationSecret: sinon.stub().resolves(null)
      }
      var ensureAggregationSecret = aggregatingStorage.ensureAggregationSecretWith(mockStorage)
      return ensureAggregationSecret('account-id')
        .then(function () {
          throw new Error('Promise should not resolve')
        }, function (err) {
          assert(err.message.indexOf('aggregation secret') >= 0)
          assert(!mockStorage.getAggregationSecret.called)
          assert(!mockStorage.putAggregationSecret.called)
        })
    })

    it('creates, persists and returns secrets per accountId', function () {
      var mockStorage = {
        getAggregationSecret: sinon.stub().resolves(null),
        putAggregationSecret: sinon.stub().resolves(null)
      }
      var ensureAggregationSecret = aggregatingStorage.ensureAggregationSecretWith(mockStorage)
      return ensureAggregationSecret('account-id', publicJwk, privateJwk)
        .then(function (key1) {
          return ensureAggregationSecret('account-id')
            .then(function (key2) {
              assert.deepStrictEqual(key1, key2)
              assert(mockStorage.getAggregationSecret.calledOnce)
              assert(mockStorage.putAggregationSecret.calledOnce)
              assert(mockStorage.putAggregationSecret.getCalls()[0].args[1])
              // this makes sure we don't persist an unencrypted key
              assert.notDeepStrictEqual(mockStorage.putAggregationSecret.getCalls()[0].args[1], key1)
              return ensureAggregationSecret('other-account-id', publicJwk, privateJwk)
            })
            .then(function (key3) {
              assert.notDeepStrictEqual(key1, key3)
              assert(mockStorage.getAggregationSecret.calledTwice)
              assert(mockStorage.putAggregationSecret.calledTwice)
            })
        })
    })
  })

  describe('aggregate(...events)', function () {
    it('aggregates objects of the same shape', function () {
      var result = aggregatingStorage.aggregate([
        { type: 'foo', value: 12 },
        { type: 'bar', value: 44 }
      ])
      assert.deepStrictEqual(result, {
        type: ['foo', 'bar'],
        value: [12, 44]
      })
    })

    it('supports passing a normalization function', function () {
      var result = aggregatingStorage.aggregate([
        { type: 'foo', payload: { value: 12 } },
        { type: 'bar', payload: { value: 44 } }
      ], function (item) {
        return {
          type: item.type,
          value: item.payload.value
        }
      })
      assert.deepStrictEqual(result, {
        type: ['foo', 'bar'],
        value: [12, 44]
      })
    })

    it('adds padding for undefined values', function () {
      var result = aggregatingStorage.aggregate([
        { solo: [99] },
        { type: 'bar', value: 12, other: 'ok' },
        { type: 'baz', value: 14, extra: true }
      ])
      assert.deepStrictEqual(result, {
        type: [null, 'bar', 'baz'],
        value: [null, 12, 14],
        extra: [null, null, true],
        other: [null, 'ok', null],
        solo: [[99], null, null]
      })
    })
  })

  describe('mergeAggregates(aggregates)', function () {
    it('merges aggregates of the same shape', function () {
      var result = aggregatingStorage.mergeAggregates([
        { type: ['a', 'b'], value: [true, false] },
        { type: ['x', 'y', 'z'], value: [1, 2, 3] }
      ])
      assert.deepStrictEqual(result, {
        type: ['a', 'b', 'x', 'y', 'z'],
        value: [true, false, 1, 2, 3]
      })
    })

    it('adds padding at the head', function () {
      var result = aggregatingStorage.mergeAggregates([
        { type: ['a', 'b'] },
        { type: ['x', 'y', 'z'], value: [1, 2, 3] }
      ])
      assert.deepStrictEqual(result, {
        type: ['a', 'b', 'x', 'y', 'z'],
        value: [null, null, 1, 2, 3]
      })
    })

    it('adds padding at the tail', function () {
      var result = aggregatingStorage.mergeAggregates([
        { type: ['a', 'b'], value: [1, 2] },
        { type: ['x', 'y', 'z'] },
        { other: [['ok']] }
      ])
      assert.deepStrictEqual(result, {
        type: ['a', 'b', 'x', 'y', 'z', null],
        value: [1, 2, null, null, null, null],
        other: [null, null, null, null, null, ['ok']]
      })
    })
  })

  describe('inflateAggregate(aggregates)', function () {
    it('deflates an aggregate into an array of objects', function () {
      var result = aggregatingStorage.inflateAggregate({
        type: ['thing', 'widget', 'roomba'],
        value: [[0], null, 'foo']
      })
      assert.deepStrictEqual(result, [
        { type: 'thing', value: [0] },
        { type: 'widget', value: null },
        { type: 'roomba', value: 'foo' }
      ])
    })
    it('throws on asymmetric input', function () {
      assert.throws(function () {
        aggregatingStorage.inflateAggregate({
          type: ['thing', 'widget', 'roomba'],
          value: [[0], null, 'foo', 'whoops']
        })
      })
    })
    it('supports passing a function for denormalizing items', function () {
      var result = aggregatingStorage.inflateAggregate({
        type: ['thing', 'widget', 'roomba'],
        value: [[0], null, 'foo']
      }, function (item) {
        return {
          type: item.type,
          payload: { value: item.value }
        }
      })
      assert.deepStrictEqual(result, [
        { type: 'thing', payload: { value: [0] } },
        { type: 'widget', payload: { value: null } },
        { type: 'roomba', payload: { value: 'foo' } }
      ])
    })
  })

  describe('removeFromAggregate(aggregate, keyRef, values)', function () {
    it('removes the matching indices from the given aggregate', function () {
      var result = aggregatingStorage.removeFromAggregate({
        type: ['a', 'b', 'x', 'y', 'z'],
        value: [true, false, 1, 2, 3]
      }, 'type', ['x', 'z'])
      assert.deepStrictEqual(result, {
        type: ['a', 'b', 'y'],
        value: [true, false, 2]
      })
    })
  })

  describe('LockedAggregatesCache', function () {
    it('enables callers to lock a value until released', function () {
      var cache = new aggregatingStorage.LockedAggregatesCache()

      function a () {
        var obj
        var release
        return cache.acquireCache('test')
          .then(function (_obj) {
            obj = _obj.cache
            release = _obj.release
            obj.value = 'a'
            return sleep(500)
          })
          .then(function () {
            obj.value += 'z'
            release('test', obj)
          })
      }

      function b () {
        return cache.acquireCache('test')
          .then(function (_obj) {
            var obj = _obj.cache
            var release = _obj.release
            obj.value += 'b'
            obj.value += 'x'
            release('test', obj)
          })
      }

      function sleep (int) {
        return new Promise(function (resolve) {
          setTimeout(resolve, int)
        })
      }

      return Promise.all([a(), b()])
        .then(function () {
          return cache.acquireCache('test')
        })
        .then(function (_obj) {
          assert.strictEqual(_obj.cache.value, 'azbx')
        })
    })
  })
})
