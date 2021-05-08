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
  this.apply = function (events) {
    return _.filter(events, function (event) {
      return event.payload.href && event.payload.href.toString() === filter
    })
  }

  this.scopedFilter = function (events) {
    return new HrefFilter(filter).apply(events)
  }
}

exports.Referrer = makeSessionFilter(function (events, filter) {
  return events[0].payload.computedReferrer === filter
})

exports.Campaign = makeSessionFilter(function (events, filter) {
  var href = events[0].payload.rawHref || events[0].payload.href
  return href.searchParams.get('utm_campaign') === filter
})

exports.Source = makeSessionFilter(function (events, filter) {
  var href = events[0].payload.rawHref || events[0].payload.href
  return href.searchParams.get('utm_source') === filter
})

exports.Landing = makeSessionFilter(function (events, filter) {
  var href = events[0].payload.href
  return href.toString() === filter
})

exports.Exit = makeSessionFilter(function (events, filter) {
  var href = _.last(events).payload.href
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
        .map(_.last)
        .filter(function (events) {
          return sessionComparison(events, filter)
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
