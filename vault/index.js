var router = require('./src/router')
var handler = require('./src/handler')
var middleware = require('./src/middleware')
var allowsCookies = require('./src/allows-cookies')

if (!window.fetch) {
  require('unfetch/polyfill')
}

if (!window.URL || !window.URLSearchParams) {
  require('url-polyfill')
}

var register = router()

register('EVENT',
  middleware.eventDuplexer,
  allowsCookiesMiddleware,
  middleware.optIn,
  function (event, respond, next) {
    handler.handleAnalyticsEvent(event.data)
      .then(function () {
        console.log(__('This page is using Offen to collect usage statistics.'))
        console.log(__('You can access and manage all of your personal data or opt-out at "%s/auditorium/".', window.location.origin))
        console.log(__('Find out more about Offen at "https://www.offen.dev".'))
      })
      .catch(next)
  })

register('QUERY', middleware.sameOrigin, callHandler(handler.handleQuery))
register('CONSENT_STATUS', middleware.sameOrigin, callHandler(handler.handleConsentStatus))
register('EXPRESS_CONSENT', middleware.sameOrigin, callHandler(handler.handleExpressConsent))
register('PURGE', middleware.sameOrigin, callHandler(handler.handlePurge))
register('LOGIN', middleware.sameOrigin, callHandler(handler.handleLogin))
register('LOGOUT', middleware.sameOrigin, callHandler(handler.handleLogout))
register('CHANGE_CREDENTIALS', middleware.sameOrigin, callHandler(handler.handleChangeCredentials))
register('FORGOT_PASSWORD', middleware.sameOrigin, callHandler(handler.handleForgotPassword))
register('RESET_PASSWORD', middleware.sameOrigin, callHandler(handler.handleResetPassword))
register('INVITE_USER', middleware.sameOrigin, callHandler(handler.handleInviteUser))
register('JOIN', middleware.sameOrigin, callHandler(handler.handleJoin))
register('CREATE_ACCOUNT', middleware.sameOrigin, callHandler(handler.handleCreateAccount))

module.exports = register

function allowsCookiesMiddleware (event, respond, next) {
  if (allowsCookies()) {
    return next()
  }
  console.log(__('This page is using Offen to collect usage statistics.'))
  console.log(__('Your setup prevents third party cookies or you have disabled it in your browser\'s settings.'))
  console.log(__('No usage data will be collected.'))
  console.log(__('Find out more about Offen at "https://www.offen.dev".'))
}

function callHandler (handler) {
  return function (event, respond, next) {
    new Promise(function (resolve) {
      resolve(handler(event.data))
    })
      .then(respond, next)
  }
}
