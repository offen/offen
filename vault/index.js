var router = require('./src/router')
var handler = require('./src/handler')
var middleware = require('./src/middleware')

if (!window.fetch) {
  require('unfetch/polyfill')
}

if (!window.URL || !window.URLSearchParams) {
  require('url-polyfill')
}

var register = router()

register('EVENT',
  middleware.eventDuplexer,
  anonymousMiddleware,
  middleware.optIn,
  function (event, respond, next) {
    console.log(__('This page is using offen to collect usage statistics.'))
    console.log(__('You can access and manage all of your personal data or opt-out at "%s/auditorium/".', window.location.origin))
    console.log(__('Find out more about offen at "https://www.offen.dev".'))
    handler.handleAnalyticsEvent(event.data)
      .catch(next)
  })

register('QUERY', middleware.sameOrigin, callHandler(handler.handleQuery))
register('OPTIN_STATUS', middleware.sameOrigin, callHandler(handler.handleOptinStatus))
register('EXPRESS_CONSENT', middleware.sameOrigin, callHandler(handler.handleConsent))
register('PURGE', middleware.sameOrigin, callHandler(handler.handlePurge))
register('LOGIN', middleware.sameOrigin, callHandler(handler.handleLogin))
register('CHANGE_CREDENTIALS', middleware.sameOrigin, callHandler(handler.handleChangeCredentials))
register('FORGOT_PASSWORD', middleware.sameOrigin, callHandler(handler.handleForgotPassword))
register('RESET_PASSWORD', middleware.sameOrigin, callHandler(handler.handleResetPassword))

module.exports = register

function anonymousMiddleware (event, respond, next) {
  if (!event.data.anoynmous) {
    return next()
  }
  console.log(__('This page is using offen to collect usage statistics.'))
  console.log(__('Your setup prevents third party cookies or you have disabled it in your browser\'s settings.'))
  console.log(__('Basic usage data will be collected anonymously.'))
  console.log(__('Find out more at "%s".', window.location.origin))
  handler.handleAnonymousEvent(event.data)
    .catch(next)
}

function callHandler (handler) {
  return function (event, respond, next) {
    Promise.resolve(handler(event.data))
      .then(respond, next)
  }
}
