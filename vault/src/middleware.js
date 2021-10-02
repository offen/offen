/**
 * Copyright 2020-2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var consentStatus = require('./user-consent')
var getSessionId = require('./session-id')
var zones = require('./zones')

exports.optIn = optIn

function optIn (event, respond, next) {
  Promise.resolve(consentStatus.get())
    .then(function (status) {
      if (status) {
        return { status: status, persist: true }
      }
      if (event.data.meta && event.data.meta.skipConsent) {
        return { status: consentStatus.DENY, persist: false }
      }
      function styleHost (payload) {
        return respond({
          type: 'STYLES',
          payload: payload
        })
      }
      styleHost.selector = respond.selector
      return consentStatus.askForConsent(styleHost)
        .then(function (status) {
          return { status: status, persist: true }
        })
    })
    .then(function (result) {
      var status = result.status
      if (result.persist) {
        consentStatus.set(status)
      }
      if (status === consentStatus.ALLOW) {
        return next()
      }
      console.log(__('This page is using Offen to collect usage statistics.'))
      console.log(__('You have opted out of data collection, no data is being collected.'))
      console.log(__('Find out more about Offen at "%s"', window.location.origin))
      respond(null)
    })
}

exports.eventDuplexer = eventDuplexer

function eventDuplexer (event, respond, next) {
  // eventDuplexerMiddleware adds properties to an event that could be subject to spoofing
  // or unwanted access by 3rd parties in "script". For example adding the session id
  // here instead of the script prevents other scripts from reading this value.
  var now = new Date()
  Object.assign(event.data.payload.event, {
    timestamp: now,
    sessionId: getSessionId(event.data.payload.accountId),
    geo: (function () {
      if (!window.Intl || !window.Intl.DateTimeFormat) {
        return null
      }
      var format = new window.Intl.DateTimeFormat()
      var timeZone = format.resolvedOptions().timeZone
      return zones[timeZone.toUpperCase()] || null
    })()
  })
  // strip search parameters from referrers as they might contain sensitive information
  if (event.data.payload.event.referrer) {
    var cleanedReferrer = new window.URL(event.data.payload.event.referrer)
    cleanedReferrer.search = ''
    event.data.payload.event.referrer = cleanedReferrer.toString()
  }

  next()
}

exports.sameOrigin = sameOrigin

function sameOrigin (event, respond, next) {
  if (event.origin !== window.location.origin) {
    return next(new Error('Incoming message had untrusted origin "' + event.origin + '", will not process.'))
  }
  next()
}
