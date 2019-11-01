var historyEvents = require('history-events')

var checkSupport = require('./src/check-support')
var router = require('./src/router')
var events = require('./src/events')

// this needs to be called on module level as otherwise the value will be undefined
// again
var accountId = document.currentScript && document.currentScript.dataset.accountId
var scriptHost = document.currentScript && document.currentScript.src
var scriptUrl = ''
try {
  scriptUrl = new window.URL(scriptHost).origin
} catch (err) {}

var app = router(process.env.VAULT_HOST || scriptUrl + '/vault/')

app.on('PAGEVIEW', supportMiddleware, function (context, send, next) {
  var message = {
    type: 'EVENT',
    payload: {
      accountId: accountId,
      event: events.pageview()
    }
  }
  send(message)
})

app.dispatch('PAGEVIEW')

historyEvents.addEventListener(window, 'changestate', function () {
  app.dispatch('PAGEVIEW')
})

module.exports = app

function supportMiddleware (context, send, next) {
  checkSupport(function (err) {
    if (err) {
      console.log(__('script/main/unsupportedError_1', err.message))
      console.log(__('script/main/unsupportedError_2'))
      return
    }
    next()
  })
}
