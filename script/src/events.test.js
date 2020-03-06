/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var events = require('./events')

describe('src/events.js', function () {
  describe('pageview()', function () {
    it('creates a pageview event', function () {
      var event = events.pageview(true)
      assert.deepStrictEqual(Object.keys(event), ['type', 'href', 'title', 'referrer', 'pageload', 'isMobile'])
      assert.strictEqual(event.type, 'PAGEVIEW')
      assert.strictEqual(typeof event.href, 'string')
      assert.strictEqual(typeof event.title, 'string')
      assert.strictEqual(typeof event.referrer, 'string')
      assert.strictEqual(typeof event.pageload, 'number')
      assert.strictEqual(typeof event.isMobile, 'boolean')

      var event2 = events.pageview(false)
      assert.deepStrictEqual(Object.keys(event2), ['type', 'href', 'title', 'referrer', 'pageload', 'isMobile'])
      assert.strictEqual(event2.pageload, null)
    })
  })
})
