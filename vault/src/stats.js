var _ = require('underscore')

var placeInBucket = require('./buckets')

exports.loss = consumeAsync(loss)

function loss (events) {
  var totalCount = events.length
  if (totalCount === 0) {
    return 0
  }
  var nonNullCount = countKeys('userId', false)(events)
  return 1 - (nonNullCount / totalCount)
}

exports.uniqueSessions = consumeAsync(countKeys(['payload', 'sessionId'], true))

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
exports.visitors = consumeAsync(countKeys('userId', true))
exports.accounts = consumeAsync(countKeys('accountId', true))

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

function consumeAsync (fn, ctx = null) {
  return function () {
    var args = [].slice.call(arguments)
    return Promise.all(args)
      .then(function (resolvedArgs) {
        return fn.apply(ctx, resolvedArgs)
      })
  }
}
