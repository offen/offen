/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var assert = require('assert')
var subDays = require('date-fns/sub_days')
var Unibabel = require('unibabel').Unibabel
var ULID = require('ulid')
var uuid = require('uuid/v4')

var queries = require('./queries')
var getDatabase = require('./database')

describe('src/queries.js', function () {
  describe('getDefaultStats(accountId, query, privateKey)', function () {
    var accountJwk
    var accountKey
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
        .then(function (_accountKey) {
          accountKey = _accountKey
          return window.crypto.subtle.exportKey('jwk', accountKey.privateKey)
        })
        .then(function (_accountJwk) {
          accountJwk = _accountJwk
        })
    })
    context('with no data present', function () {
      var db
      var getDefaultStats

      beforeEach(function () {
        db = getDatabase('test-' + uuid())
        getDefaultStats = queries.getDefaultStatsWith(function () {
          return db
        })
      })

      afterEach(function () {
        return db.delete()
      })

      it('returns an object of the correct shape without failing', function () {
        return getDefaultStats('test-account', {}, accountJwk)
          .then(function (data) {
            assert.deepStrictEqual(
              Object.keys(data),
              [
                'uniqueUsers', 'uniqueAccounts', 'uniqueSessions',
                'referrers', 'pages', 'pageviews', 'bounceRate', 'loss',
                'avgPageload', 'avgPageDepth', 'landingPages', 'exitPages',
                'mobileShare', 'livePages', 'liveUsers', 'campaigns',
                'sources', 'retentionMatrix', 'empty', 'returningUsers', 'resolution', 'range'
              ]
            )
            assert.strictEqual(data.uniqueUsers, 0)
            assert.strictEqual(data.uniqueAccounts, 0)
            assert.strictEqual(data.uniqueSessions, 0)
            assert.strictEqual(data.mobileShare, null)

            assert.deepStrictEqual(data.referrers, [])

            assert.strictEqual(data.pageviews.length, 7)
            assert(data.pageviews.every(function (day) {
              return day.accounts === 0 &&
                day.pageviews === 0 &&
                day.visitors === 0
            }))
            assert(data.pageviews[0].date < data.pageviews[1].date)

            assert.strictEqual(data.bounceRate, 0)
            assert.strictEqual(data.retentionMatrix.length, 4)
          })
      })

      it('handles queries correctly', function () {
        return getDefaultStats(
          'test-account', { range: 12, resolution: 'weeks' },
          accountJwk
        )
          .then(function (data) {
            assert.strictEqual(data.pageviews.length, 12)
          })
      })

      afterEach(function () {
        return db.delete()
      })
    })

    context('populated with data', function () {
      var db
      var getDefaultStats
      var now

      before(function () {
        var userSecretsById = {}
        db = getDatabase('test-' + uuid())
        getDefaultStats = queries.getDefaultStatsWith(function () {
          return db
        })
        // this is a sunday morning
        now = new Date('2019-07-14T10:01:00.000Z')
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
                    accountKey.publicKey,
                    Unibabel.utf8ToBuffer(JSON.stringify(jwk))
                  )
                  .then(function (encrypted) {
                    return '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encrypted))
                  })
              })
          })
        return Promise.all(userSecrets)
          .then(function (encryptedSecrets) {
            return db.keys.bulkAdd([
              { type: 'ENCRYPTED_SECRET', secretId: 'test-user-1', value: encryptedSecrets[0] },
              { type: 'ENCRYPTED_SECRET', secretId: 'test-user-2', value: encryptedSecrets[1] }
            ])
          })
          .then(function (res) {
            var minuteAgo = new Date('2019-07-14T10:00:30.000Z')
            var events = [
              {
                accountId: 'test-account-1',
                secretId: 'test-user-1',
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
                secretId: 'test-user-1',
                eventId: ULID.ulid(minuteAgo.getTime()),
                timestamp: minuteAgo.toJSON(),
                payload: {
                  type: 'PAGEVIEW',
                  href: 'https://www.offen.dev/contact',
                  title: 'Contact',
                  sessionId: 'session-id-1',
                  referrer: '',
                  timestamp: minuteAgo.toJSON(),
                  pageload: 200
                }
              },
              {
                accountId: 'test-account-1',
                secretId: 'test-user-1',
                eventId: ULID.ulid(subDays(now, 1).getTime()),
                timestamp: subDays(now, 1).toJSON(),
                payload: {
                  type: 'PAGEVIEW',
                  href: 'https://www.offen.dev/deep-dive',
                  title: 'Deep dive',
                  sessionId: 'session-id-2',
                  referrer: 'https://www.offen.dev',
                  timestamp: subDays(now, 1).toJSON(),
                  pageload: 100
                }
              },
              {
                accountId: 'test-account-1',
                secretId: 'test-user-2',
                eventId: ULID.ulid(subDays(now, 1).getTime()),
                timestamp: subDays(now, 1).toJSON(),
                payload: {
                  type: 'PAGEVIEW',
                  href: 'https://www.offen.dev/deep-dive',
                  title: 'Deep dive',
                  sessionId: 'session-id-3',
                  referrer: '',
                  timestamp: subDays(now, 1).toJSON(),
                  pageload: 200
                }
              },
              {
                accountId: 'test-account-2',
                secretId: 'test-user-1',
                eventId: ULID.ulid(subDays(now, 2).getTime()),
                timestamp: subDays(now, 2).toJSON(),
                payload: {
                  type: 'PAGEVIEW',
                  href: 'https://www.puppies.com',
                  title: 'Very cute',
                  sessionId: 'session-id-4',
                  referrer: 'https://www.cute.com',
                  timestamp: subDays(now, 2).toJSON(),
                  pageload: null
                }
              },
              {
                accountId: 'test-account-2',
                secretId: 'test-user-1',
                eventId: ULID.ulid(subDays(now, 12).getTime()),
                timestamp: subDays(now, 12).toJSON(),
                payload: {
                  type: 'PAGEVIEW',
                  href: 'https://www.puppies.com',
                  title: 'Very cute',
                  sessionId: 'session-id-5',
                  referrer: '',
                  timestamp: subDays(now, 12).toJSON(),
                  pageload: 100
                }
              },
              {
                accountId: 'test-account-1',
                secretId: null,
                eventId: ULID.ulid(minuteAgo.getTime()),
                timestamp: minuteAgo.toJSON(),
                payload: {
                  type: 'PAGEVIEW',
                  timestamp: minuteAgo.toJSON(),
                  pageload: 150
                }
              },
              {
                accountId: 'test-account-1',
                secretId: null,
                eventId: ULID.ulid(subDays(now, 12).getTime()),
                timestamp: subDays(now, 12).toJSON(),
                payload: {
                  type: 'PAGEVIEW',
                  timestamp: subDays(now, 12).toJSON(),
                  pageload: null
                }
              },
              {
                accountId: 'test-account-1',
                secretId: null,
                eventId: ULID.ulid(subDays(now, 4).getTime()),
                timestamp: subDays(now, 4).toJSON(),
                payload: {
                  type: 'PAGEVIEW',
                  timestamp: subDays(now, 4).toJSON(),
                  pageload: 150
                }
              }
            ].map(function (event) {
              if (!event.secretId) {
                return window.crypto.subtle
                  .encrypt(
                    {
                      name: 'RSA-OAEP'
                    },
                    accountKey.publicKey,
                    Unibabel.utf8ToBuffer(JSON.stringify(event.payload))
                  )
                  .then(function (encryptedEventPayload) {
                    event.payload = '{1,} ' + Unibabel.arrToBase64(new Uint8Array(encryptedEventPayload))
                    return event
                  })
              }
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
          .then(function (events) {
            return db.events.bulkAdd(events)
          })
      })

      after(function () {
        return db.delete()
      })

      it('calculates stats correctly using defaults', function () {
        return getDefaultStats('test-account', { now: now }, accountJwk)
          .then(function (data) {
            assert.deepStrictEqual(
              Object.keys(data),
              [
                'uniqueUsers', 'uniqueAccounts', 'uniqueSessions',
                'referrers', 'pages', 'pageviews', 'bounceRate', 'loss',
                'avgPageload', 'avgPageDepth', 'landingPages', 'exitPages',
                'mobileShare', 'livePages', 'liveUsers', 'campaigns',
                'sources', 'retentionMatrix', 'empty', 'returningUsers', 'resolution', 'range'
              ]
            )

            assert.strictEqual(data.uniqueUsers, 2)
            assert.strictEqual(data.uniqueAccounts, 2)
            assert.strictEqual(data.uniqueSessions, 4)
            assert.strictEqual(data.pages.length, 4)
            assert.strictEqual(data.landingPages.length, 3)
            assert.strictEqual(data.exitPages.length, 1)
            assert.strictEqual(data.referrers.length, 1)
            assert.strictEqual(data.avgPageload, 160)
            assert.strictEqual(data.avgPageDepth, 1.25)
            assert.strictEqual(data.mobileShare, 0)

            assert.strictEqual(data.pageviews[6].accounts, 1)
            assert.strictEqual(data.pageviews[6].pageviews, 2)
            assert.strictEqual(data.pageviews[6].visitors, 1)

            assert.strictEqual(data.pageviews[5].accounts, 1)
            assert.strictEqual(data.pageviews[5].pageviews, 2)
            assert.strictEqual(data.pageviews[5].visitors, 2)

            assert.strictEqual(data.pageviews[4].accounts, 1)
            assert.strictEqual(data.pageviews[4].pageviews, 1)
            assert.strictEqual(data.pageviews[4].visitors, 1)

            assert.strictEqual(data.pageviews[3].accounts, 0)
            assert.strictEqual(data.pageviews[3].pageviews, 0)
            assert.strictEqual(data.pageviews[3].visitors, 0)

            assert.strictEqual(data.bounceRate, 0.75)
            assert.strictEqual(data.loss, 1 - (5 / 7))
            assert.strictEqual(data.retentionMatrix.length, 4)
          })
      })

      it('calculates stats correctly with a weekly query', function () {
        return getDefaultStats(
          'test-account',
          { range: 2, resolution: 'weeks', now: now },
          accountJwk
        )
          .then(function (data) {
            assert.deepStrictEqual(
              Object.keys(data),
              [
                'uniqueUsers', 'uniqueAccounts', 'uniqueSessions',
                'referrers', 'pages', 'pageviews', 'bounceRate', 'loss',
                'avgPageload', 'avgPageDepth', 'landingPages', 'exitPages',
                'mobileShare', 'livePages', 'liveUsers', 'campaigns',
                'sources', 'retentionMatrix', 'empty', 'returningUsers', 'resolution', 'range'
              ]
            )

            assert.strictEqual(data.uniqueUsers, 2)
            assert.strictEqual(data.uniqueAccounts, 2)
            assert.strictEqual(data.uniqueSessions, 5)
            assert.strictEqual(data.pages.length, 4)
            assert.strictEqual(data.referrers.length, 1)
            assert.strictEqual(data.landingPages.length, 3)
            assert.strictEqual(data.exitPages.length, 1)
            assert.strictEqual(data.avgPageload, 150)
            assert.strictEqual(data.avgPageDepth, 1.2)
            assert.strictEqual(data.mobileShare, 0)

            assert.strictEqual(data.pageviews[1].accounts, 2)
            assert.strictEqual(data.pageviews[1].pageviews, 5)
            assert.strictEqual(data.pageviews[1].visitors, 2)

            assert.strictEqual(data.pageviews[0].accounts, 2)
            assert.strictEqual(data.pageviews[0].pageviews, 1)
            assert.strictEqual(data.pageviews[0].visitors, 1)

            assert.strictEqual(data.bounceRate, 0.8)

            assert.strictEqual(data.loss, 1 - (6 / 9))
            assert.strictEqual(data.retentionMatrix.length, 4)
          })
      })

      it('calculates stats correctly with a hourly query', function () {
        return getDefaultStats(
          'test-account',
          { range: 12, resolution: 'hours', now: now },
          accountJwk
        )
          .then(function (data) {
            assert.deepStrictEqual(
              Object.keys(data),
              [
                'uniqueUsers', 'uniqueAccounts', 'uniqueSessions',
                'referrers', 'pages', 'pageviews', 'bounceRate', 'loss',
                'avgPageload', 'avgPageDepth', 'landingPages', 'exitPages',
                'mobileShare', 'livePages', 'liveUsers', 'campaigns',
                'sources', 'retentionMatrix', 'empty', 'returningUsers', 'resolution', 'range'
              ]
            )

            assert.strictEqual(data.uniqueUsers, 1)
            assert.strictEqual(data.uniqueAccounts, 1)
            assert.strictEqual(data.uniqueSessions, 1)
            assert.strictEqual(data.pages.length, 2)
            assert.strictEqual(data.referrers.length, 0)
            assert.strictEqual(data.landingPages.length, 1)
            assert.strictEqual(data.exitPages.length, 1)
            assert.strictEqual(data.avgPageload, 175)
            assert.strictEqual(data.avgPageDepth, 2)
            assert.strictEqual(data.mobileShare, 0)

            assert.strictEqual(data.pageviews[11].accounts, 1)
            assert.strictEqual(data.pageviews[11].pageviews, 2)
            assert.strictEqual(data.pageviews[11].visitors, 1)

            assert.strictEqual(data.pageviews[10].accounts, 0)
            assert.strictEqual(data.pageviews[10].pageviews, 0)
            assert.strictEqual(data.pageviews[10].visitors, 0)

            assert.strictEqual(data.bounceRate, 0)

            assert.strictEqual(data.loss, 1 - (2 / 3))
            assert.strictEqual(data.retentionMatrix.length, 4)
          })
      })
    })
  })

  describe('getLatestEvent', function () {
    var db
    var getLatestEvent

    beforeEach(function () {
      db = getDatabase('test-' + uuid())
      getLatestEvent = queries.getLatestEventWith(function () {
        return db
      })
    })

    afterEach(function () {
      return db.delete()
    })

    it('returns null when no events are known', function () {
      return getLatestEvent('account-id')
        .then(function (result) {
          assert.strictEqual(result, null)
        })
    })

    it('returns the highest sorting event id for the requested account', function () {
      return db.events.bulkAdd([
        { accountId: 'account-a', eventId: 'a' },
        { accountId: 'account-a', eventId: 'b' },
        { accountId: 'account-a', eventId: 't' },
        { accountId: 'account-a', eventId: 'c' }
      ]).then(function () {
        return getLatestEvent('account-a')
          .then(function (result) {
            assert.strictEqual(result.eventId, 't')
          })
      })
    })
  })

  describe('getAllEventIds', function () {
    var db
    var getAllEventIds

    beforeEach(function () {
      db = getDatabase('test-' + uuid())
      getAllEventIds = queries.getAllEventIdsWith(function () {
        return db
      })
    })

    afterEach(function () {
      return db.delete()
    })

    it('returns an ordered list of all known event ids', function () {
      return db.events.bulkAdd([
        { accountId: 'account-a', eventId: 'a' },
        { accountId: 'account-a', eventId: 'b' },
        { accountId: 'account-a', eventId: 't' },
        { accountId: 'account-a', eventId: 'c' }
      ]).then(function () {
        return getAllEventIds('account-a')
          .then(function (result) {
            assert.deepStrictEqual(result, ['a', 'b', 'c', 't'])
          })
      })
    })
  })

  describe('parseAndValidateEvent', function () {
    it('parses referrer values into a URL', function () {
      const result = queries.parseAndValidateEvent({
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
      const result = queries.parseAndValidateEvent({
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
      const result = queries.parseAndValidateEvent({
        payload: {
          type: 'PAGEVIEW',
          href: 'https://www.offen.dev/foo',
          timestamp: new Date().toJSON(),
          sessionId: 'session'
        }
      })
      assert(result.payload.href instanceof window.URL)
      assert.strictEqual(result.payload.href.toString(), 'https://www.offen.dev/foo')
    })

    it('skips bad href values', function () {
      const result = queries.parseAndValidateEvent({
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
  })

  it('skips unkown event types', function () {
    const result = queries.parseAndValidateEvent({
      payload: {
        type: 'ZALGO',
        href: 'https://www.offen.dev/foo',
        timestamp: new Date().toJSON(),
        sessionId: 'session'
      }
    })
    assert.strictEqual(result, null)
  })

  it('skips bad timestamps', function () {
    const result = queries.parseAndValidateEvent({
      payload: {
        type: 'PAGEVIEW',
        href: 'https://www.offen.dev/foo',
        timestamp: 8192,
        sessionId: 'session'
      }
    })
    assert.strictEqual(result, null)
  })
})
