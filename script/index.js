/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var historyEvents = require('history-events')

var checkSupport = require('./src/check-support')
var router = require('./src/router')
var events = require('./src/events')

// this needs to be called on module level as otherwise the value will be undefined
// again when being accessed from inside a function body
var accountId = document.currentScript && document.currentScript.dataset.accountId
var scriptHost = document.currentScript && document.currentScript.src
var scriptUrl = ''
try {
  scriptUrl = new window.URL(scriptHost).origin
} catch (err) {}

function main () {
  var app = router(process.env.VAULT_HOST || scriptUrl + '/vault/')
  app.on('PAGEVIEW', supportMiddleware, function (context, send, next) {
    var message = {
      type: 'EVENT',
      payload: {
        accountId: accountId,
        event: events.pageview(context === 'initial')
      }
    }
    send(message)
  })

  switch (document.readyState) {
    case 'complete':
    case 'loaded':
    case 'interactive':
      app.dispatch('PAGEVIEW', 'initial')
      break
    default:
      document.addEventListener('DOMContentLoaded', function () {
        app.dispatch('PAGEVIEW', 'initial')
      })
  }

  historyEvents.addEventListener(window, 'changestate', function () {
    app.dispatch('PAGEVIEW')
  })
  return app
}

window.__offen__ = window.__offen__ || main()
module.exports = window.__offen__

function supportMiddleware (context, send, next) {
  checkSupport(function (err) {
    if (err) {
      console.log(__('Offen does not support this site: %s', err.message))
      console.log(__('No data will be collected. Find out more at "https://www.offen.dev".'))
      return
    }
    next()
  })
}
