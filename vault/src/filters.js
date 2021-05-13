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
      return event.payload.href && event.payload.href.toString() === filter
    })
  }

  this.scopedFilter = function (events) {
    return self.apply(events)
  }
}

exports.Referrer = makeSessionFilter(function (session, filter) {
  var sessionEntry = _.findWhere(session, function (event) {
    return event.payload.$referrer
  })
  return sessionEntry && sessionEntry.payload.$referrer === filter
})

exports.Campaign = makeSessionFilter(function (session, filter) {
  var sessionEntry = _.findWhere(session, function (event) {
    return (event.payload.rawHref || event.payload.href).get('utm_campaign')
  })
  var href = sessionEntry.payload.rawHref || sessionEntry.payload.href
  return href.searchParams.get('utm_campaign') === filter
})

exports.Source = makeSessionFilter(function (session, filter) {
  var sessionEntry = _.findWhere(session, function (event) {
    return (event.payload.rawHref || event.payload.href).get('utm_source')
  })
  var href = sessionEntry.payload.rawHref || sessionEntry.payload.href
  return href.searchParams.get('utm_source') === filter
})

exports.Landing = makeSessionFilter(function (session, filter) {
  var href = _.head(session).payload.href
  return href.toString() === filter
})

exports.Exit = makeSessionFilter(function (session, filter) {
  var href = _.last(session).payload.href
  return href.toString() === filter
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
        .pairs()
        .map(function (pair) {
          return _.sortBy(pair[1], 'eventId')
        })
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
