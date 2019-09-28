var historyEvents = require('history-events')

var checkSupport = require('./src/check-support')
var router = require('./src/router')
var pageview = require('./src/pageview')

// this needs to be called on module level as otherwise the value will be undefined
// again
var accountId = document.currentScript && document.currentScript.dataset.accountId
var scriptHost = document.currentScript && document.currentScript.src
var scriptUrl = {}
try {
  scriptUrl = new window.URL(scriptHost)
} catch (err) {}

var app = router(process.env.VAULT_HOST || scriptUrl.origin + '/vault/')

app.on('EVENT', supportMiddleware, function (message, send, next) {
  send(message)
})

app.dispatch('EVENT', Object.assign({
  accountId: accountId,
  event: pageview()
}))

historyEvents.addEventListener(window, 'changestate', function () {
  app.dispatch('EVENT', Object.assign({
    accountId: accountId,
    event: pageview()
  }))
})

module.exports = app

function supportMiddleware (message, send, next) {
  checkSupport(function (err) {
    if (err) {
      console.log('"offen" does not support this site: ' + err.message)
      console.log('No data will be collected. Find out more at "https://www.offen.dev".')
    }
    next(err)
  })
}
