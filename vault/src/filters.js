/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

exports.Noop = NoopFilter
function NoopFilter () {
  this.apply = _.identity
  this.scopedFilter = _.identity
}

exports.Href = HrefFilter
function HrefFilter (filter) {
  var self = this
  this.apply = function (events) {
    return _.filter(events, function (event) {
      if (!event.payload.href) {
        return false
      }
      var strippedHref = event.payload.href.origin + event.payload.href.pathname
      return strippedHref === filter
    })
  }

  this.scopedFilter = function (events) {
    return self.apply(events)
  }
}

exports.Geo = makeSessionFilter(function (session, filter) {
  var firstMatch = _.find(session, function (event) {
    return event.payload.geo
  }) || session[0]
  if (filter === '__NONE_GEOLOCATION__') {
    return !firstMatch.payload.geo
  }
  return firstMatch.payload.geo === filter
})

exports.Referrer = makeSessionFilter(function (session, filter) {
  var sessionEntry = _.head(session)
  if (filter === '__NONE_REFERRER__') {
    return !sessionEntry.payload.$referrer
  }
  return sessionEntry.payload.$referrer === filter
})

exports.Campaign = makeSessionFilter(function (session, filter) {
  var firstMatch = _.find(session, function (event) {
    return (event.payload.rawHref || event.payload.href).searchParams.get('utm_campaign')
  })
  if (!firstMatch) {
    return false
  }
  var href = firstMatch.payload.rawHref || firstMatch.payload.href
  return href.searchParams.get('utm_campaign') === filter
})

exports.Source = makeSessionFilter(function (session, filter) {
  var firstMatch = _.find(session, function (event) {
    return (event.payload.rawHref || event.payload.href).searchParams.get('utm_source')
  })
  if (!firstMatch) {
    return false
  }
  var href = firstMatch.payload.rawHref || firstMatch.payload.href
  return href.searchParams.get('utm_source') === filter
})

exports.Landing = makeSessionFilter(function (session, filter) {
  var head = _.head(session)
  var strippedHref = head.payload.href.origin + head.payload.href.pathname
  return strippedHref === filter
})

exports.Exit = makeSessionFilter(function (session, filter) {
  var last = _.last(session)
  var strippedHref = last.payload.href.origin + last.payload.href.pathname
  return strippedHref === filter
})

function makeSessionFilter (sessionComparison) {
  return function Filter (filter) {
    var self = this
    var _resolve

    this._ready = new Promise(function (resolve) {
      _resolve = resolve
    })

    this.apply = function (events) {
      var filtered = _.chain(events)
        .groupBy(_.property(['payload', 'sessionId']))
        .values()
        .filter(function (session) {
          return sessionComparison(session, filter)
        })
        .flatten(true)
        .value()

      var sessionIds = _.chain(filtered)
        .map(_.property(['payload', 'sessionId']))
        .groupBy(_.identity)
        .value()

      _resolve(sessionIds)
      return filtered
    }

    this.scopedFilter = function (events) {
      return self._ready.then(function (sessionIds) {
        return _.filter(events, function (event) {
          return sessionIds[event.payload.sessionId]
        })
      })
    }
  }
}
