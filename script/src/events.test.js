/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var events = require('./events')

describe('src/events.js', function () {
  describe('pageview()', function () {
    it('creates a pageview event', function () {
      var event = events.pageview(false)
      assert.deepStrictEqual(Object.keys(event), ['type', 'href', 'referrer', 'pageload', 'isMobile'])
      assert.strictEqual(event.type, 'PAGEVIEW')
      assert.strictEqual(typeof event.href, 'string')
      assert.strictEqual(typeof event.referrer, 'string')
      assert.strictEqual(typeof event.pageload, 'number')
      assert.strictEqual(typeof event.isMobile, 'boolean')

      var event2 = events.pageview(true)
      assert.deepStrictEqual(Object.keys(event2), ['type', 'href', 'referrer', 'pageload', 'isMobile'])
      assert.strictEqual(event2.pageload, null)
    })
    context('with relative canonical links', function () {
      let link
      beforeEach(function () {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        link.setAttribute('href', '/foo')
        document.head.append(link)
      })
      it('resolves relative canonical links', function () {
        var event = events.pageview(false)
        assert.strictEqual(event.href, window.location.origin + '/foo')
        assert.ok(event.rawHref)
      })
      afterEach(function () {
        document.head.removeChild(link)
      })
    })
    context('with absolute canonical links', function () {
      let link
      beforeEach(function () {
        link = document.createElement('link')
        link.setAttribute('rel', 'canonical')
        link.setAttribute('href', 'https://example.com/bar')
        document.head.append(link)
      })
      it('uses the full link', function () {
        var event = events.pageview(false)
        assert.strictEqual(event.href, 'https://example.com/bar')
        assert.ok(event.rawHref)
      })
      afterEach(function () {
        document.head.removeChild(link)
      })
    })
  })
})
