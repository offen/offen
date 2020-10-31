/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var aggregatingStorage = require('./aggregating-storage')

describe('src/aggregating-storage.js', function () {
  describe('validateAndParseEvent', function () {
    it('parses referrer values into a URL', function () {
      const result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          referrer: 'https://blog.foo.bar',
          href: 'https://www.offen.dev/foo',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert(result.payload.referrer instanceof window.URL)
      // handling as a URL appends a trailing slash
      assert.strictEqual(result.payload.referrer.toString(), 'https://blog.foo.bar/')
    })
    it('skips bad referrer values', function () {
      const result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          referrer: '<script>alert("ZALGO")</script>',
          href: 'https://shady.business',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result, null)
    })

    it('parses href values into a URL', function () {
      const result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo/',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert(result.payload.href instanceof window.URL)
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo/')
    })

    it('skips bad href values', function () {
      const result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          referrer: 'https://shady.business',
          href: '<script>alert("ZALGO")</script>',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result, null)
    })

    it('skips unkown event types', function () {
      const result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'ZALGO',
          href: 'https://www.offen.dev/foo/',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result, null)
    })

    it('skips bad timestamps', function () {
      const result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo/',
          timestamp: 8192,
          sessionId: 'session'
        }
      })
      assert.strictEqual(result, null)
    })

    it('normalizes trailing slashes on URLs', function () {
      let result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo/')

      result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo/',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo/')

      result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo/?bar-baz',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo/?bar-baz')

      result = aggregatingStorage.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo?bar-baz',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo/?bar-baz')
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
        type: [undefined, 'bar', 'baz'],
        value: [undefined, 12, 14],
        extra: [undefined, undefined, true],
        other: [undefined, 'ok', undefined],
        solo: [[99], undefined, undefined]
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
        value: [undefined, undefined, 1, 2, 3]
      })
    })

    it('adds padding at the tail', function () {
      var result = aggregatingStorage.mergeAggregates([
        { type: ['a', 'b'], value: [1, 2] },
        { type: ['x', 'y', 'z'] },
        { other: [['ok']] }
      ])
      assert.deepStrictEqual(result, {
        type: ['a', 'b', 'x', 'y', 'z', undefined],
        value: [1, 2, undefined, undefined, undefined, undefined],
        other: [undefined, undefined, undefined, undefined, undefined, ['ok']]
      })
    })

    it('prevents duplicates when given a constraint', function () {
      var result = aggregatingStorage.mergeAggregates([
        { id: ['a', 'b'], value: [1, 2] },
        { id: ['x', 'y', 'a'], value: [4, 3, 1] }
      ], 'id')
      assert.deepStrictEqual(result, {
        id: ['a', 'b', 'x', 'y'],
        value: [1, 2, 4, 3]
      })
    })

    it('allows duplicates when not given a constraint', function () {
      var result = aggregatingStorage.mergeAggregates([
        { id: ['a', 'b'], value: [1, 2] },
        { id: ['x', 'y', 'a'], value: [4, 3, 1] }
      ])
      assert.deepStrictEqual(result, {
        id: ['a', 'b', 'x', 'y', 'a'],
        value: [1, 2, 4, 3, 1]
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
        return cache.acquireCache('test')
          .then(function (_obj) {
            obj = _obj
            obj.value = 'a'
            return sleep(500)
          })
          .then(function () {
            obj.value += 'z'
            cache.releaseCache('test', obj)
          })
      }

      function b () {
        var obj
        return cache.acquireCache('test')
          .then(function (_obj) {
            obj = _obj
            obj.value += 'b'
            obj.value += 'x'
            cache.releaseCache('test', obj)
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
        .then(function (cache) {
          assert.strictEqual(cache.value, 'azbx')
        })
    })
  })
})
