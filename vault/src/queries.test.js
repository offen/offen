/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var queries = require('./queries')

describe('src/queries.js', function () {
  describe('validateAndParseEvent', function () {
    it('parses referrer values into a URL', function () {
      const result = queries.validateAndParseEvent({
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
      const result = queries.validateAndParseEvent({
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
      const result = queries.validateAndParseEvent({
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
      const result = queries.validateAndParseEvent({
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
      const result = queries.validateAndParseEvent({
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
      const result = queries.validateAndParseEvent({
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
      let result = queries.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo/')

      result = queries.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo/',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo/')

      result = queries.validateAndParseEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo/?bar-baz',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo/?bar-baz')

      result = queries.validateAndParseEvent({
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

  describe('getDefaultStats(accountId, query, privateJwk)', function () {
    it('throws on bad arguments', function () {
      var q = new queries.Queries()
      var err
      return q.getDefaultStats('abc-123', {})
        .catch(function (_err) {
          err = _err
        })
        .then(function () {
          assert(err)
        })
    })

    it('throws on unknown query parameters', function () {
      var q = new queries.Queries()
      var err
      return q.getDefaultStats('abc-123', { range: 12, resolution: 'aeons' }, {})
        .catch(function (_err) {
          err = _err
        })
        .then(function () {
          assert(err)
        })
    })
  })
})
