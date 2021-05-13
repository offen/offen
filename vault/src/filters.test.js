/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var filters = require('./filters')

describe('src/filters.js', function () {
  describe('filters.Href(filter)', function () {
    it('filters for exact matches of href', function () {
      var filter = new filters.Href('https://www.offen.dev/about')
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

      var scopedResult = filter.scopedFilter([
        { payload: {} },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.offen.dev/about') } },
        { payload: { sessionId: 'session-B', href: new window.URL('https://www.offen.dev') } },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about/imprint') } },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/') } },
        { payload: { sessionId: 'session-B', href: new window.URL('https://www.offen.dev/other') } }
      ])
      assert.deepStrictEqual(scopedResult, [
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.offen.dev/about') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.offen.dev/about') } }
      ])
    })
  })

  describe('filters.Referrer(filter)', function () {
    it('filters for exact matches of $referrer', function () {
      var filter = new filters.Referrer('https://coolblog.com')
      var result = filter.apply([
        { eventId: 'a', payload: { sessionId: 'session-z', $referrer: null } },
        { eventId: 'b', payload: { sessionId: 'session-b', $referrer: 'Hacker News' } },
        { eventId: 'c', payload: { sessionId: 'session-B', $referrer: 'https://coolblog.com' } },
        { eventId: 'd', payload: { sessionId: 'session-a', $referrer: 'https://coolblog.com' } },
        { eventId: 'e', payload: { sessionId: 'session-a', $referrer: 'https://coolblog.com' } },
        { eventId: 'f', payload: { sessionId: 'session-B', $referrer: 'Google' } }
      ])
      assert.deepStrictEqual(result, [
        { eventId: 'c', payload: { sessionId: 'session-B', $referrer: 'https://coolblog.com' } },
        { eventId: 'f', payload: { sessionId: 'session-B', $referrer: 'Google' } },
        { eventId: 'd', payload: { sessionId: 'session-a', $referrer: 'https://coolblog.com' } },
        { eventId: 'e', payload: { sessionId: 'session-a', $referrer: 'https://coolblog.com' } }
      ])

      return filter.scopedFilter([
        { eventId: 'f', payload: { sessionId: 'session-z', $referrer: null } },
        { eventId: 'g', payload: { sessionId: 'session-x', $referrer: 'https://coolblog.com' } },
        { eventId: 'h', payload: { sessionId: 'session-B', $referrer: 'Google' } }
      ])
        .then(function (scopedResult) {
          assert.deepStrictEqual(scopedResult, [
            { eventId: 'h', payload: { sessionId: 'session-B', $referrer: 'Google' } }
          ])
        })
    })
  })
})
