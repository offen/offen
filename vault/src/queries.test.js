var assert = require('assert')
var uuid = require('uuid/v4')
var subDays = require('date-fns/sub_days')

var queries = require('./queries')
var getDatabase = require('./database')

describe('src/queries.js', function () {
  describe.skip('getDefaultStats(db, query)', function () {
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
        return getDefaultStats('test-account')
          .then(function (data) {
            assert.deepStrictEqual(
              Object.keys(data),
              [
                'uniqueUsers', 'uniqueAccounts', 'uniqueSessions',
                'referrers', 'pages', 'pageviews', 'bounceRate', 'loss',
                'resolution', 'range'
              ]
            )
            assert.strictEqual(data.uniqueUsers, 0)
            assert.strictEqual(data.uniqueAccounts, 0)
            assert.strictEqual(data.uniqueSessions, 0)
            assert.deepStrictEqual(data.referrers, [])

            assert.strictEqual(data.pageviews.length, 7)
            assert(data.pageviews.every(function (day) {
              return day.accounts === 0 &&
                day.pageviews === 0 &&
                day.visitors === 0
            }))
            assert(data.pageviews[0].date < data.pageviews[1].date)

            assert.strictEqual(data.bounceRate, 0)
          })
      })

      it('handles queries correctly', function () {
        return getDefaultStats('test-account', { range: 12, resolution: 'weeks' })
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

      beforeEach(function () {
        db = getDatabase('test-' + uuid())
        getDefaultStats = queries.getDefaultStatsWith(function () {
          return db
        })
        // this is a sunday morning
        now = new Date('2019-07-14T10:00:00.000Z')
        return db.events.bulkAdd([
          {
            accountId: 'test-account-1',
            userId: 'test-user-1',
            eventId: 'test-event-1',
            payload: {
              type: 'PAGEVIEW',
              href: 'https://www.offen.dev',
              title: 'Transparent web analytics',
              sessionId: 'session-id-1',
              referrer: '',
              timestamp: now.toJSON()
            }
          },
          {
            accountId: 'test-account-1',
            userId: 'test-user-1',
            eventId: 'test-event-2',
            payload: {
              type: 'PAGEVIEW',
              href: 'https://www.offen.dev/contact',
              title: 'Contact',
              sessionId: 'session-id-1',
              referrer: '',
              timestamp: now.toJSON()
            }
          },
          {
            accountId: 'test-account-1',
            userId: 'test-user-1',
            eventId: 'test-event-3',
            payload: {
              type: 'PAGEVIEW',
              href: 'https://www.offen.dev/deep-dive',
              title: 'Deep dive',
              sessionId: 'session-id-2',
              referrer: 'https://www.offen.dev',
              timestamp: subDays(now, 1).toJSON()
            }
          },
          {
            accountId: 'test-account-1',
            userId: 'test-user-2',
            eventId: 'test-event-4',
            payload: {
              type: 'PAGEVIEW',
              href: 'https://www.offen.dev/deep-dive',
              title: 'Deep dive',
              sessionId: 'session-id-3',
              referrer: '',
              timestamp: subDays(now, 1).toJSON()
            }
          },
          {
            accountId: 'test-account-2',
            userId: 'test-user-1',
            eventId: 'test-event-5',
            payload: {
              type: 'PAGEVIEW',
              href: 'https://www.puppies.com',
              title: 'Very cute',
              sessionId: 'session-id-4',
              referrer: 'https://www.cute.com',
              timestamp: subDays(now, 2).toJSON()
            }
          },
          {
            accountId: 'test-account-2',
            userId: 'test-user-1',
            eventId: 'test-event-6',
            payload: {
              type: 'PAGEVIEW',
              href: 'https://www.puppies.com',
              title: 'Very cute',
              sessionId: 'session-id-5',
              referrer: '',
              timestamp: subDays(now, 12).toJSON()
            }
          },
          {
            accountId: 'test-account-1',
            userId: null,
            eventId: 'test-event-7',
            payload: {
              type: 'PAGEVIEW',
              timestamp: now.toJSON()
            }
          },
          {
            accountId: 'test-account-1',
            userId: null,
            eventId: 'test-event-8',
            payload: {
              type: 'PAGEVIEW',
              timestamp: subDays(now, 12).toJSON()
            }
          },
          {
            accountId: 'test-account-1',
            userId: null,
            eventId: 'test-event-9',
            payload: {
              type: 'PAGEVIEW',
              timestamp: subDays(now, 4).toJSON()
            }
          }
        ])
      })

      afterEach(function () {
        return db.delete()
      })

      it('calculates stats correctly using defaults', function () {
        return getDefaultStats('test-account', { now: now })
          .then(function (data) {
            assert.deepStrictEqual(
              Object.keys(data),
              [
                'uniqueUsers', 'uniqueAccounts', 'uniqueSessions',
                'referrers', 'pages', 'pageviews', 'bounceRate', 'loss',
                'resolution', 'range'
              ]
            )

            assert.strictEqual(data.uniqueUsers, 2)
            assert.strictEqual(data.uniqueAccounts, 2)
            assert.strictEqual(data.uniqueSessions, 4)
            assert.strictEqual(data.pages.length, 4)
            assert.strictEqual(data.referrers.length, 1)

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
          })
      })

      it('calculates stats correctly with a weekly query', function () {
        return getDefaultStats('test-account', { range: 2, resolution: 'weeks', now: now })
          .then(function (data) {
            assert.deepStrictEqual(
              Object.keys(data),
              [
                'uniqueUsers', 'uniqueAccounts', 'uniqueSessions',
                'referrers', 'pages', 'pageviews', 'bounceRate', 'loss',
                'resolution', 'range'
              ]
            )

            assert.strictEqual(data.uniqueUsers, 2)
            assert.strictEqual(data.uniqueAccounts, 2)
            assert.strictEqual(data.uniqueSessions, 5)
            assert.strictEqual(data.pages.length, 4)
            assert.strictEqual(data.referrers.length, 1)

            assert.strictEqual(data.pageviews[1].accounts, 2)
            assert.strictEqual(data.pageviews[1].pageviews, 5)
            assert.strictEqual(data.pageviews[1].visitors, 2)

            assert.strictEqual(data.pageviews[0].accounts, 2)
            assert.strictEqual(data.pageviews[0].pageviews, 1)
            assert.strictEqual(data.pageviews[0].visitors, 1)

            assert.strictEqual(data.bounceRate, 0.8)

            assert.strictEqual(data.loss, 1 - (6 / 9))
          })
      })

      it('calculates stats correctly with a hourly query', function () {
        return getDefaultStats('test-account', { range: 12, resolution: 'hours', now: now })
          .then(function (data) {
            assert.deepStrictEqual(
              Object.keys(data),
              [
                'uniqueUsers', 'uniqueAccounts', 'uniqueSessions',
                'referrers', 'pages', 'pageviews', 'bounceRate', 'loss',
                'resolution', 'range'
              ]
            )

            assert.strictEqual(data.uniqueUsers, 1)
            assert.strictEqual(data.uniqueAccounts, 1)
            assert.strictEqual(data.uniqueSessions, 1)
            assert.strictEqual(data.pages.length, 2)
            assert.strictEqual(data.referrers.length, 0)

            assert.strictEqual(data.pageviews[11].accounts, 1)
            assert.strictEqual(data.pageviews[11].pageviews, 2)
            assert.strictEqual(data.pageviews[11].visitors, 1)

            assert.strictEqual(data.pageviews[10].accounts, 0)
            assert.strictEqual(data.pageviews[10].pageviews, 0)
            assert.strictEqual(data.pageviews[10].visitors, 0)

            assert.strictEqual(data.bounceRate, 0)

            assert.strictEqual(data.loss, 1 - (2 / 3))
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
})
