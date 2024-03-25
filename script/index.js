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
var useApi = document.currentScript && 'useApi' in document.currentScript.dataset
var scriptLocale = document.currentScript && document.currentScript.dataset.locale

var scriptUrl = ''
try {
  scriptUrl = new window.URL(scriptHost).origin
} catch (err) {}

function main () {
  var vaultUrl = new window.URL(process.env.VAULT_HOST || scriptUrl + '/vault')
  if (accountId) {
    vaultUrl.searchParams.set('accountId', accountId)
  }
  if (scriptLocale) {
    vaultUrl.searchParams.set('locale', scriptLocale)
  }
  var app = router(vaultUrl.toString())
  app.on('PAGEVIEW', supportMiddleware, function (context, send, next) {
    var message = {
      type: 'EVENT',
      payload: {
        accountId: accountId,
        event: events.pageview(context && context.subsequent)
      },
      meta: {
        skipConsent: context && context.skipConsent
      }
    }
    send(message)
  })

  app.on('ACQUIRE_CONSENT', supportMiddleware, function (context, send, next) {
    var message = {
      type: 'ACQUIRE_CONSENT',
      payload: null
    }
    send(message)
  })

  if (useApi) {
    app.pageview = function (context, callback) {
      if (!callback && Object.prototype.toString.call(context) === '[object Function]') {
        callback = context
        context = null
      }
      app.dispatch('PAGEVIEW', context, callback)
    }

    app.acquireConsent = function (callback) {
      app.dispatch('ACQUIRE_CONSENT', null, callback)
    }
    return app
  }

  onReady(function () {
    app.dispatch('PAGEVIEW')
  })
  historyEvents.addEventListener(window, 'changestate', function () {
    app.dispatch('PAGEVIEW', { subsequent: true })
  })

  return app
}

window.__offen__ = window.__offen__ || main()
module.exports = window.__offen__

function supportMiddleware (context, send, next) {
  checkSupport(function (err) {
    if (err) {
      console.log(__('Offen Fair Web Analytics does not support this site: %s', err.message))
      console.log(__('No data will be collected. Find out more at "https://www.offen.dev".'))
      return
    }
    next()
  })
}

function onReady (callback) {
  switch (document.readyState) {
    case 'complete':
    case 'interactive':
      window.setTimeout(function () {
        callback()
      }, 0)
      break
    default:
      document.addEventListener('DOMContentLoaded', function () {
        callback()
      })
  }
}
