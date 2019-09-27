var router = require('./src/router')
var handler = require('./src/handler')
var allowsCookies = require('./src/allows-cookies')
var hasOptedOut = require('./src/user-optout')

var vault = router()

vault.on('EVENT', optOutMiddleware, anonymousMiddleware, function (event, respond, next) {
  console.log('This page is using offen to collect usage statistics.')
  console.log('You can access and manage all of your personal data or opt-out at "' + window.location.origin + '/auditorium/".')
  console.log('Find out more about offen at "https://www.offen.dev".')
  handler.handleAnalyticsEvent(event.data)
    .catch(next)
})

// all handler that are registered after this middleware are subject
// to same origin restrictions, i.e. will be called by the auditorium only.
vault.use(sameOriginMiddleware)

vault.on('OPTOUT', callHandler(handler.handleOptout))
vault.on('OPTOUT_STATUS', callHandler(handler.handleOptoutStatus))
vault.on('QUERY', callHandler(handler.handleQuery))
vault.on('PURGE', callHandler(handler.handlePurge))
vault.on('LOGIN', callHandler(handler.handleLogin))
vault.on('CHANGE_CREDENTIALS', callHandler(handler.handleChangeCredentials))
vault.on('FORGOT_PASSWORD', callHandler(handler.handleForgotPassword))
vault.on('RESET_PASSWORD', callHandler(handler.handleResetPassword))

function sameOriginMiddleware (event, respond, next) {
  if (event.origin !== window.location.origin) {
    return next(new Error('Incoming message had untrusted origin "' + event.origin + '", will not process.'))
  }
  next()
}

function optOutMiddleware (event, respond, next) {
  if (!hasOptedOut()) {
    return next()
  }
  console.log('This page is using offen to collect usage statistics.')
  console.log('You have opted out of data collection, no data is being collected.')
  console.log('Find out more about offen at "https://www.offen.dev".')
}

function anonymousMiddleware (event, respond, next) {
  if (allowsCookies()) {
    return next()
  }
  console.log('This page is using offen to collect usage statistics.')
  console.log('Your setup prevents or you have disabled third party cookies in your browser\'s settings.')
  console.log('Basic usage data will be collected anonymously.')
  console.log('Find out more at "https://www.offen.dev".')
  handler.handleAnonymousEvent(event.message)
    .catch(next)
}

function callHandler (handler) {
  return function (event, respond, next) {
    Promise.resolve(handler(event.data))
      .then(respond, next)
  }
}
