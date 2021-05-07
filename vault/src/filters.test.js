/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var filters = require('./filters')

describe('src/filters.js', function () {
  describe('filters.href(filter)', function () {
    it('filters for exact matches of href', function () {
      var filter = new filters.Href('https://www.offen.dev/about') // eslint-disable-line
      var result = filter.apply([
        { payload: {} },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.offen.dev/about') } },
        { payload: { sessionId: 'session-B', href: new window.URL('https://www.offen.dev') } },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about/imprint') } },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/') } },
        { payload: { sessionId: 'session-B', href: new window.URL('https://www.offen.dev/other') } }
      ])
      assert.deepStrictEqual(result, [
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.offen.dev/about') } }
      ])
    })
  })
})
