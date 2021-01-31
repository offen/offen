/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')

var stats = require('./stats')

describe('src/stats.js', function () {
  describe('stats.uniqueSessions(events)', function () {
    it('counts the number of unique session identifiers', function () {
      return stats.uniqueSessions([
        {},
        { payload: {} },
        { payload: { sessionId: 'session-a' } },
        { payload: { sessionId: 'session-b' } },
        { payload: { sessionId: 'session-B' } },
        { payload: { sessionId: 'session-a' } },
        { payload: { sessionId: 'session-a' } },
        { payload: { sessionId: 'session-B' } }
      ])
        .then(function (result) {
          assert.strictEqual(result, 3)
        })
    })
    it('returns 0 when given an empty list', function () {
      return stats.uniqueSessions([])
        .then(function (result) {
          assert.strictEqual(result, 0)
        })
    })
  })

  describe('stats.bounceRate(events)', function () {
    it('calculates the percentage of session identifiers that occur only once', function () {
      return stats.bounceRate([
        { payload: { sessionId: 'session-a' } },
        { payload: { sessionId: 'session-b' } },
        { payload: { sessionId: 'session-B' } },
        { payload: { sessionId: 'session-c' } },
        { payload: { sessionId: 'session-B' } },
        { payload: { sessionId: 'session-B' } },
        { payload: { sessionId: 'session-B' } },
        { timestamp: new Date().toJSON() }
      ])
        .then(function (result) {
          assert.strictEqual(result, 0.75)
        })
    })
    it('returns 0 on when given an empty list', function () {
      return stats.bounceRate([])
        .then(function (result) {
          assert.strictEqual(result, 0)
        })
    })
    it('returns 1 on a list of unique session id', function () {
      return stats.bounceRate([
        { payload: { sessionId: 'session-a' } },
        { payload: { sessionId: 'session-b' } },
        { payload: { sessionId: 'session-B' } },
        { payload: { sessionId: 'session-c' } },
        {}
      ])
        .then(function (result) {
          assert.strictEqual(result, 1)
        })
    })
  })

  describe('stats.avgPageload(events)', function () {
    it('calculates the average of the pageload times present in the set of events', function () {
      return stats.avgPageload([
        { timestamp: new Date().toJSON() },
        { payload: { pageload: 200 } },
        { payload: {} },
        { payload: { pageload: 200 } },
        { payload: { pageload: 400 } },
        { payload: { pageload: 100 } },
        { payload: { pageload: 100 } }
      ])
        .then(function (result) {
          assert.strictEqual(result, 200)
        })
    })
    it('returns null on an empty list of events', function () {
      return stats.avgPageload([])
        .then(function (result) {
          assert.strictEqual(result, null)
        })
    })
  })

  describe('stats.avgPageDepth(events)', function () {
    it('returns the average session length', function () {
      return stats.avgPageDepth([
        {},
        { payload: { sessionId: 'session-a' } },
        { payload: { sessionId: 'session-b' } },
        { payload: { sessionId: 'session-b' } },
        { payload: { sessionId: 'session-a' } },
        { payload: { sessionId: 'session-c' } },
        { payload: { sessionId: 'session-a' } }
      ])
        .then(function (result) {
          assert.strictEqual(result, 2)
        })
    })
    it('returns null when given an empty array of events', function () {
      return stats.avgPageDepth([])
        .then(function (result) {
          assert.strictEqual(result, null)
        })
    })
  })

  describe('stats.pageviews(events)', function () {
    it('counts the number of events with secretId value', function () {
      return stats.pageviews([
        { secretId: 'user-b' },
        { secretId: 'user-a' },
        { secretId: null },
        { secretId: 'user-b' },
        { secretId: 'user-c' },
        {}
      ])
        .then(function (result) {
          assert.strictEqual(result, 4)
        })
    })
    it('returns 0 when given an empty list', function () {
      return stats.pageviews([])
        .then(function (result) {
          assert.strictEqual(result, 0)
        })
    })
  })

  describe('stats.visitors(events)', function () {
    it('counts the number of events with distinct secretId values', function () {
      return stats.visitors([
        { secretId: 'user-b' },
        { secretId: 'user-a' },
        { secretId: null },
        { secretId: 'user-b' },
        { secretId: 'user-c' },
        {}
      ])
        .then(function (result) {
          assert.strictEqual(result, 3)
        })
    })
    it('returns 0 when given an empty list', function () {
      return stats.visitors([])
        .then(function (result) {
          assert.strictEqual(result, 0)
        })
    })
  })

  describe('stats.accounts(events)', function () {
    it('counts the number of events with distinct accountId values', function () {
      return stats.accounts([
        { accountId: 'account-b' },
        { accountId: 'account-a' },
        { accountId: null },
        { accountId: 'account-b' },
        { accountId: 'account-c' },
        {}
      ])
        .then(function (result) {
          assert.strictEqual(result, 3)
        })
    })
    it('returns 0 when given an empty list', function () {
      return stats.accounts([])
        .then(function (result) {
          assert.strictEqual(result, 0)
        })
    })
  })

  describe('stats.referrers(events)', function () {
    it('returns sorted referrer values from foreign domains grouped by host', function () {
      return stats.referrers([
        { payload: {} },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.mysite.com/x'), referrer: new window.URL('https://www.example.net/foo') } },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.mysite.com/y'), referrer: new window.URL('https://www.example.net/bar') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.mysite.com/z'), referrer: new window.URL('https://www.example.net/baz') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.mysite.com/a'), referrer: new window.URL('https://www.example.net/baz') } },
        { payload: { sessionId: 'session-c', href: new window.URL('https://www.mysite.com/x'), referrer: new window.URL('https://beep.boop/#!foo=bar') } },
        { payload: { sessionId: 'session-d', href: new window.URL('https://www.mysite.com/x'), referrer: new window.URL('https://www.mysite.com/a') } }
      ])
        .then(function (result) {
          assert.deepStrictEqual(result, [
            { key: 'www.example.net', count: [2, 2] },
            { key: 'beep.boop', count: [1, 1] }
          ])
        })
    })
    it('returns an empty array when given an empty array', function () {
      return stats.referrers([])
        .then(function (result) {
          assert.deepStrictEqual(result, [])
        })
    })
  })

  describe('stats.campaigns(events)', function () {
    it('returns sorted referrer campaigns from foreign domains grouped by host', function () {
      return stats.campaigns([
        { payload: {} },
        { payload: { sessionId: 'session-a', href: new window.URL('https://www.example.net/foo?utm_campaign=beep') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.example.net/bar?something=12&utm_campaign=boop') } },
        { payload: { sessionId: 'session-b', href: new window.URL('https://www.example.net/baz') } },
        { payload: { sessionId: 'session-c', href: new window.URL('https://www.example.net/baz') } },
        { payload: { sessionId: 'session-d', href: new window.URL('https://beep.boop/site'), rawHref: new window.URL('https://beep.boop/site?utm_campaign=beep') } },
        { payload: { sessionId: 'session-e', href: new window.URL('https://www.mysite.com/a') } }
      ])
        .then(function (result) {
          assert.deepStrictEqual(result, [
            { key: 'beep', count: [2, 1] },
            { key: 'boop', count: [1, 2] }
          ])
        })
    })
    it('returns an empty array when given an empty array', function () {
      return stats.campaigns([])
        .then(function (result) {
          assert.deepStrictEqual(result, [])
        })
    })
  })

  describe('stats.pages(events)', function () {
    it('returns a sorted list of pages grouped by a clean URL', function () {
      return stats.pages([
        { payload: {} },
        { accountId: 'account-a', secretId: 'user-a', payload: { href: new window.URL('https://www.example.net/foo') } },
        { accountId: 'account-a', secretId: 'user-a', payload: { href: new window.URL('https://www.example.net/foo?param=bar') } },
        { accountId: 'account-b', secretId: 'user-z', payload: { href: new window.URL('https://beep.boop/site#!/foo') } },
        { accountId: 'account-a', secretId: null, payload: { } }
      ])
        .then(function (result) {
          assert.deepStrictEqual(result, [
            { key: 'https://www.example.net/foo', count: 2 },
            { key: 'https://beep.boop/site', count: 1 }
          ])
        })
    })
    it('returns an empty array when given no events', function () {
      return stats.pages([])
        .then(function (result) {
          assert.deepStrictEqual(result, [])
        })
    })
  })

  describe('stats.activePages(events)', function () {
    it('returns a sorted list of active pages grouped by a clean URL', function () {
      return stats.activePages([
        { payload: {} },
        { accountId: 'account-a', secretId: 'user-a', payload: { timestamp: '100', href: new window.URL('https://www.example.net/bar') } },
        { accountId: 'account-a', secretId: 'user-a', payload: { timestamp: '120', href: new window.URL('https://www.example.net/foo?param=bar') } },
        { accountId: 'account-b', secretId: 'user-z', payload: { timestamp: '200', href: new window.URL('https://beep.boop/site#!/foo') } },
        { accountId: 'account-a', secretId: null, payload: { } }
      ])
        .then(function (result) {
          assert.deepStrictEqual(result, [
            { key: 'https://beep.boop/site', count: 1 },
            { key: 'https://www.example.net/foo', count: 1 }
          ])
        })
    })
    it('returns an empty array when given no events', function () {
      return stats.pages([])
        .then(function (result) {
          assert.deepStrictEqual(result, [])
        })
    })
  })

  describe('stats.landingPages(events)', function () {
    it('returns a sorted list of landing pages grouped by a clean URL', function () {
      return stats.landingPages([
        { payload: {} },
        { secretId: 'user-a', payload: { timestamp: '0', sessionId: 'session-a', href: new window.URL('https://www.example.net/foo') } },
        { secretId: 'user-a', payload: { timestamp: '1', sessionId: 'session-a', href: new window.URL('https://www.example.net/bar') } },
        { secretId: 'user-a', payload: { timestamp: '2', sessionId: 'session-a', href: new window.URL('https://www.example.net/baz') } },
        { secretId: 'user-b', payload: { timestamp: '247', sessionId: 'session-b', href: new window.URL('https://www.example.net/foo?param=bar') } },
        { secretId: 'user-b', payload: { timestamp: '290', sessionId: 'session-b', href: new window.URL('https://www.example.net/bar?param=foo') } },
        { secretId: 'user-z', payload: { timestamp: '50', sessionId: 'session-c', href: new window.URL('https://beep.boop/site#!/foo') } },
        { secretId: null, payload: { } }
      ])
        .then(function (result) {
          assert.deepStrictEqual(result, [
            { key: 'https://www.example.net/foo', count: 2 },
            { key: 'https://beep.boop/site', count: 1 }
          ])
        })
    })
    it('returns an empty array when given no events', function () {
      return stats.landingPages([])
        .then(function (result) {
          assert.deepStrictEqual(result, [])
        })
    })
  })

  describe('stats.exitPages(events)', function () {
    it('returns a sorted list of exit pages grouped by a clean URL', function () {
      return stats.exitPages([
        { payload: {} },
        { secretId: 'user-a', payload: { timestamp: '0', sessionId: 'session-a', href: new window.URL('https://www.example.net/foo') } },
        { secretId: 'user-a', payload: { timestamp: '1', sessionId: 'session-a', href: new window.URL('https://www.example.net/bar') } },
        { secretId: 'user-a', payload: { timestamp: '2', sessionId: 'session-a', href: new window.URL('https://www.example.net/baz') } },
        { secretId: 'user-b', payload: { timestamp: '247', sessionId: 'session-b', href: new window.URL('https://www.example.net/foo?param=bar') } },
        { secretId: 'user-b', payload: { timestamp: '290', sessionId: 'session-b', href: new window.URL('https://www.example.net/bar?param=foo') } },
        { secretId: 'user-z', payload: { timestamp: '50', sessionId: 'session-c', href: new window.URL('https://beep.boop/site#!/foo') } },
        { secretId: null, payload: { } }
      ])
        .then(function (result) {
          assert.deepStrictEqual(result, [
            { key: 'https://www.example.net/bar', count: 1 },
            { key: 'https://www.example.net/baz', count: 1 }
          ])
        })
    })
    it('returns an empty array when given no events', function () {
      return stats.exitPages([])
        .then(function (result) {
          assert.deepStrictEqual(result, [])
        })
    })
  })

  describe('stats.returningUsers(events, allEvents)', function () {
    it('calculates the number of new users in a range compared to all events', function () {
      return stats.returningUsers(
        [
          { eventId: 'e-06', secretId: 's-01' },
          { eventId: 'e-07', secretId: 's-02' },
          { eventId: 'e-08', secretId: 's-03' }
        ],
        [
          { eventId: 'e-01', secretId: 's-99' },
          { eventId: 'e-02', secretId: 's-00' },
          { eventId: 'e-03', secretId: 's-01' },
          { eventId: 'e-04', secretId: 's-99' },
          { eventId: 'e-05', secretId: 's-99' },
          { eventId: 'e-06', secretId: 's-01' },
          { eventId: 'e-07', secretId: 's-02' },
          { eventId: 'e-08', secretId: 's-03' }
        ]
      )
        .then(function (result) {
          assert.strictEqual(result, 1 - (2 / 3))
        })
    })
    it('returns zero when given no events', function () {
      return stats.returningUsers([], [])
        .then(function (result) {
          assert.strictEqual(result, 0)
        })
    })
  })

  describe('stats.retention(...events)', function () {
    it('returns a retention matrix for the given event chunks', function () {
      return stats.retention(
        [{ secretId: 'user-a' }, { secretId: 'user-b' }, { secretId: 'user-y' }, { secretId: 'user-z' }],
        [{ secretId: 'user-m' }, { secretId: 'user-a' }, { secretId: 'user-z' }],
        [{ secretId: 'user-k' }, { secretId: 'user-m' }, { secretId: 'user-z' }],
        []
      )
        .then(function (result) {
          assert.deepStrictEqual(result, [[1, 0.5, 0.25, 0], [1, 2 / 3, 0], [1, 0], [0]])
        })
    })
    it('returns 0 values when given empty chunks', function () {
      return stats.retention(
        [],
        [],
        []
      )
        .then(function (result) {
          assert.deepStrictEqual(result, [[0, 0, 0], [0, 0], [0]])
        })
    })
    it('returns an empty array when given no events', function () {
      return stats.retention()
        .then(function (result) {
          assert.deepStrictEqual(result, [])
        })
    })
  })

  describe('stats.onboardingStats(...events)', function () {
    it('returns data about the last event in the set and the associated account', function () {
      return stats.onboardingStats([
        {
          eventId: 'event-a',
          accountId: 'account-a',
          payload: { referrer: new window.URL('https://www.coolblog.com/nice-article'), href: new window.URL('https://www.offen.dev'), isMobile: false }
        },
        {
          eventId: 'event-z',
          accountId: 'account-a',
          payload: { referrer: new window.URL('https://www.coolblog.com/ok'), href: new window.URL('https://www.offen.dev/get-started'), isMobile: false }
        },
        {
          eventId: 'event-b',
          accountId: 'account-b',
          payload: { referrer: new window.URL('https://www.coolblog.com/other'), href: new window.URL('https://www.example.com'), isMobile: true }
        },
        {
          eventId: 'event-x',
          accountId: 'account-a',
          payload: { referrer: new window.URL('https://www.coolblog.com/something'), href: new window.URL('https://www.offen.dev'), isMobile: false }
        }
      ])
        .then(function (result) {
          assert.deepStrictEqual(result, {
            domain: 'www.offen.dev',
            url: 'www.offen.dev/get-started',
            referrer: 'www.coolblog.com',
            numVisits: 3,
            isMobile: false
          })
        })
    })
    it('returns null when given no events', function () {
      return stats.onboardingStats([])
        .then(function (result) {
          assert.deepStrictEqual(result, null)
        })
    })
  })
})
