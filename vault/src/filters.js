/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var _ = require('underscore')

exports.noop = NoopFilter
function NoopFilter () {
  var self = this

  this.digest = function (events) {
    this._events = events
    return self
  }

  this.apply = function () {
    return Promise.resolve(this._events)
  }

  this.scopedFilter = function () {
    return Promise.resolve(_.identity)
  }
}

exports.href = HrefFilter
function HrefFilter (filter) {
  var self = this
  var _resolve

  this.ready = new Promise(function (resolve) {
    _resolve = resolve
  })

  this.digest = function (events) {
    self._events = events
    _resolve()
    return self
  }

  this.apply = function () {
    return this.ready.then(function () {
      return _.filter(self._events, function (event) {
        return event.payload.href && event.payload.href.toString() === filter
      })
    })
  }

  this.scopedFilter = function () {
    return this.ready.then(function () {
      return function (events) {
        return new HrefFilter(filter).digest(events).apply()
      }
    })
  }
}
