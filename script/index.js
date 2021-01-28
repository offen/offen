/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

const historyEvents = require('history-events')

const checkSupport = require('./src/check-support')
const router = require('./src/router')
const events = require('./src/events')

// this needs to be called on module level as otherwise the value will be undefined
// again when being accessed from inside a function body
const accountId = document.currentScript && document.currentScript.dataset.accountId
const scriptHost = document.currentScript && document.currentScript.src
const useApi = document.currentScript && 'useApi' in document.currentScript.dataset

let scriptUrl = ''
try {
  scriptUrl = new window.URL(scriptHost).origin
} catch (err) {}

function main () {
  const app = router(process.env.VAULT_HOST || scriptUrl + '/vault/')
  app.on('PAGEVIEW', supportMiddleware, function (context, send, next) {
    const message = {
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
    const message = {
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
      console.log(__('Offen does not support this site: %s', err.message))
      console.log(__('No data will be collected. Find out more at "https://www.offen.dev".'))
      return
    }
    next()
  })
}

function onReady (callback) {
  switch (document.readyState) {
    case 'complete':
    case 'loaded':
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
