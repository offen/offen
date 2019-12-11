var _ = require('underscore')

var placeInBucket = require('./buckets')

// `loss` is the percentage of anonymous events (i.e. events without a
// user identifier) in the given set of events.
exports.loss = consumeAsync(loss)

function loss (events) {
  var totalCount = events.length
  if (totalCount === 0) {
    return 0
  }
  var nonNullCount = countKeys('userId', false)(events)
  return 1 - (nonNullCount / totalCount)
}

// The bounce rate is calculated as the percentage of session identifiers
// in the set of events that are associated with one event only, i.e. there
// has been no follow-up event.
exports.bounceRate = consumeAsync(bounceRate)

function bounceRate (events) {
  var sessionCounts = 0
  var bounces = _.chain(events)
    .map(_.property(['payload', 'sessionId']))
    .compact()
    .countBy(_.identity)
    .values()
    .tap(function (sessions) {
      sessionCounts = sessions.length
    })
    .filter(function (pagesInSession) {
      return pagesInSession === 1
    })
    .size()
    .value()

  if (sessionCounts === 0) {
    return 0
  }

  // The bounce rate is the percentage of sessions where there is only
  // one event with the respective identifier in the given se
  return bounces / sessionCounts
}

// `referrers` is the list of referrer values, grouped by host name. Common
// referrers (i.e. search engines or apps) will replaced with a human-friendly
// name assigned to their bucket.
exports.referrers = consumeAsync(referrers)

function referrers (events) {
  return _.chain(events)
    .filter(function (event) {
      if (event.userId === null || !event.payload || !event.payload.referrer) {
        return false
      }
      return event.payload.referrer.host !== event.payload.href.host
    })
    .map(function (event) {
      return event.payload.referrer.host || event.payload.referrer.href
    })
    .compact()
    .map(placeInBucket)
    .countBy(_.identity)
    .pairs()
    .map(function (pair) {
      return { host: pair[0], pageviews: pair[1] }
    })
    .sortBy('pageviews')
    .reverse()
    .value()
}

// `pages` contains all pages visited sorted by the number of pageviews.
// URLs are stripped off potential query strings and hash parameters
// before grouping.
exports.pages = consumeAsync(pages)

function pages (events) {
  var keys = events
    .filter(function (event) {
      return event.userId !== null && event.payload && event.payload.href
    })
    .map(function (event) {
      return [event.accountId, event.payload.href]
    })

  var cleanedKeys = keys.map(function (pair) {
    var accountId = pair[0]
    var url = pair[1]
    // query string parameters are disregarded
    var strippedHref = url.origin + url.pathname
    return [accountId, strippedHref]
  })

  var byAccount = cleanedKeys.reduce(function (acc, next) {
    acc[next[0]] = acc[next[0]] || []
    acc[next[0]].push(next)
    return acc
  }, {})

  return _.chain(byAccount)
    .values()
    .map(function (pageviews) {
      var counts = _.countBy(pageviews, function (pageview) {
        return pageview[1]
      })
      return Object.keys(counts).map(function (url) {
        return { url: url, pageviews: counts[url] }
      })
    })
    .flatten(true)
    .sortBy('pageviews')
    .reverse()
    .value()
}

// `avgPageload` calculates the average pageload time of the given
// set of events
exports.avgPageload = consumeAsync(avgPageload)

function avgPageload (events) {
  var count
  var total = _.chain(events)
    .map(_.property(['payload', 'pageload']))
    .compact()
    .tap(function (entries) {
      count = entries.length
    })
    .reduce(function (acc, next) {
      return acc + next
    }, 0)
    .value()

  if (count === 0) {
    return null
  }

  return total / count
}

// `avgPageDepth` calculates the average session length in the given
// set of events
exports.avgPageDepth = consumeAsync(avgPageDepth)

function avgPageDepth (events) {
  var views = countKeys(['payload', 'sessionId'], false)(events)
  var uniqueSessions = countKeys(['payload', 'sessionId'], true)(events)
  if (uniqueSessions === 0) {
    return null
  }
  return views / uniqueSessions
}

exports.exitPages = consumeAsync(exitPages)

// `exitPages` groups the given events by session identifier and then
// returns a sorted list of exit pages for these sessions. URLs will be
// stripped off query and hash parameters. Sessions that only contain
// a single page will be excluded.
function exitPages (events) {
  return _.chain(events)
    .filter(function (e) {
      return e.userId !== null && e.payload && e.payload.sessionId && e.payload.href
    })
    .groupBy(function (e) {
      return e.payload.sessionId
    })
    .map(function (events, key) {
      if (events.length < 2) {
        return null
      }
      // for each session, we are only interested in the first
      // event and its href value
      var landing = _.chain(events)
        .sortBy('timestamp')
        .last()
        .value()
      return landing.payload.href.origin + landing.payload.href.pathname
    })
    .compact()
    .countBy(_.identity)
    .pairs()
    .map(function (pair) {
      return { url: pair[0], pageviews: pair[1] }
    })
    .sortBy('pageviews')
    .reverse()
    .value()
}

// `landingPages` groups the given events by session identifier and then
// returns a sorted list of landing pages for these sessions. URLs will be
// stripped off query and hash parameters.
exports.landingPages = consumeAsync(landingPages)

function landingPages (events) {
  return _.chain(events)
    .filter(function (e) {
      return e.userId !== null && e.payload && e.payload.sessionId && e.payload.href
    })
    .groupBy(function (e) {
      return e.payload.sessionId
    })
    .map(function (events, key) {
      // for each session, we are only interested in the first
      // event and its href value
      var landing = _.chain(events)
        .sortBy('timestamp')
        .first()
        .value()
      return landing.payload.href.origin + landing.payload.href.pathname
    })
    .countBy(_.identity)
    .pairs()
    .map(function (pair) {
      return { url: pair[0], pageviews: pair[1] }
    })
    .sortBy('pageviews')
    .reverse()
    .value()
}

// `mobileShare` returns the percentage of events flagged as mobile
// in the given set of events.
exports.mobileShare = consumeAsync(mobileShare)

function mobileShare (events) {
  var allEvents
  var mobileEvents = _.chain(events)
    .filter('userId')
    .tap(function (events) {
      allEvents = events.length
    })
    .filter(_.property(['payload', 'isMobile']))
    .size()
    .value()

  if (allEvents === 0) {
    return null
  }
  return mobileEvents / allEvents
}

exports.pageviews = consumeAsync(countKeys('userId', false))
// `visitors` is the number of unique users for the given
//  set of events.
exports.visitors = consumeAsync(countKeys('userId', true))
// This is the number of unique accounts for the given timeframe
exports.accounts = consumeAsync(countKeys('accountId', true))
// This is the number of unique sessions for the given timeframe
exports.uniqueSessions = consumeAsync(countKeys(['payload', 'sessionId'], true))

function countKeys (keys, unique) {
  return function (elements) {
    var list = _.map(elements, _.property(keys))
    list = _.compact(list)
    if (unique) {
      list = _.uniq(list)
    }
    return list.length
  }
}

// `consumeAsync` ensures the given function can be called with both
// synchronous and asynchronous values as arguments. The return value
// will be wrapped in a Promise.
function consumeAsync (fn, ctx) {
  ctx = ctx || null
  return function () {
    var args = [].slice.call(arguments)
    return Promise.all(args)
      .then(function (resolvedArgs) {
        return fn.apply(ctx, resolvedArgs)
      })
  }
}
