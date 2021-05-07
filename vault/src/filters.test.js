/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var filters = require('./filters')

describe('src/filters.js', function () {
  describe('filters.href(filter)', function () {
    it('filters for exact matches of href', function () {
      var filter = new filters.href('https://www.offen.dev/about') // eslint-disable-line
      return filter.digest([
        { payload: {} },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.offen.dev/about') } },
        { payload: { sessionId: 'session-B', href: new window.URL('https://www.offen.dev') } },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about/imprint') } },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/') } },
        { payload: { sessionId: 'session-B', href: new window.URL('https://www.offen.dev/other') } }
      ])
        .apply()
        .then(function (result) {
          assert.deepStrictEqual(result, [
            { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about') } },
            { payload: { sessionId: 'session-b', href: new window.URL('https://www.offen.dev/about') } }
          ])
        })
    })
  })
})
