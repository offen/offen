var handleAnalyticsEvent = require('./src/handle-analytics-event')
var handleAnonymousEvent = require('./src/handle-anonymous-event')
var handleQuery = require('./src/handle-query')
var handleLogin = require('./src/handle-login')
var handlePurge = require('./src/handle-purge')
var handleOptout = require('./src/handle-optout')
var handleChangePassword = require('./src/handle-change-password')
var handleOptoutStatus = require('./src/handle-optout-status')
var allowsCookies = require('./src/allows-cookies')
var hasOptedOut = require('./src/user-optout')

var SKIP_TOKEN = '__SKIP_TOKEN__'

window.addEventListener('message', function (event) {
  var message = event.data
  var origin = event.origin
  var ports = event.ports

  function withSameOrigin (handler) {
    return function () {
      if (origin !== window.location.origin) {
        console.warn('Incoming message had untrusted origin "' + origin + '", will not process.')
        return SKIP_TOKEN
      }
      return handler.apply(null, [].slice.call(arguments))
    }
  }

  var handler = function () {
    return Promise.reject(
      new Error(
        'Received message of unknown type "' + message.type + '", skipping.'
      )
    )
  }

  switch (message.type) {
    case 'EVENT': {
      if (hasOptedOut()) {
        handler = function () {
          console.log('This page is using offen to collect usage statistics.')
          console.log('You have opted out of data collection, no data is being collected.')
          console.log('Find out more about offen at "https://www.offen.dev".')
          return Promise.resolve()
        }
      } else if (!allowsCookies()) {
        handler = function () {
          console.log('This page is using offen to collect usage statistics.')
          console.log('Your setup prevents or you have disabled third party cookies in your browser\'s settings.')
          console.log('Basic usage data will be collected anonymously.')
          console.log('Find out more at "https://www.offen.dev".')
          return handleAnonymousEvent.apply(null, [].slice.call(arguments))
        }
      } else {
        handler = function () {
          console.log('This page is using offen to collect usage statistics.')
          console.log('You can access and manage all of your personal data or opt-out at "' + window.location.origin + '/auditorium/".')
          console.log('Find out more about offen at "https://www.offen.dev".')
          return handleAnalyticsEvent.apply(null, [].slice.call(arguments))
        }
      }
      break
    }
    case 'QUERY':
      handler = withSameOrigin(handleQuery)
      break
    case 'LOGIN':
      handler = withSameOrigin(handleLogin)
      break
    case 'PURGE':
      handler = withSameOrigin(handlePurge)
      break
    case 'OPTOUT':
      handler = withSameOrigin(handleOptout)
      break
    case 'OPTOUT_STATUS':
      handler = withSameOrigin(handleOptoutStatus)
      break
    case 'CHANGE_PASSWORD':
      handler = withSameOrigin(handleChangePassword)
      break
  }

  function respond (message) {
    if (ports && ports.length && message !== SKIP_TOKEN) {
      ports[0].postMessage(message)
    }
  }

  Promise.resolve(handler(message))
    .then(respond, function (err) {
      // this is not in a catch block on purpose as
      // it tries to prevent a situation where calling
      // `respond` throws an error, which would in turn
      // call it again, throwing another error
      if (process.env.NODE_ENV !== 'production') {
        console.error(err)
      }
      respond({
        type: 'ERROR',
        payload: {
          error: err.message,
          stack: err.stack
        }
      })
    })
    .catch(function (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Error responding to incoming message.')
        console.error(err)
      }
    })
})
