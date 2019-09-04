var handleAnalyticsEvent = require('./src/handle-analytics-event')
var handleAnonymousEvent = require('./src/handle-anonymous-event')
var handleQuery = require('./src/handle-query')
var handleLogin = require('./src/handle-login')
var handlePurge = require('./src/handle-purge')
var handleOptout = require('./src/handle-optout')
var handleOptoutStatus = require('./src/handle-optout-status')
var allowsCookies = require('./src/allows-cookies')
var hasOptedOut = require('./src/user-optout')

var SKIP_TOKEN = '__SKIP_TOKEN__'

// This is a list of all host applications that are allowed to request data
// by in response to messages. It is important to keep this restricted
// to trusted applications only, otherwise decrypted event data may leak to
// third parties.
var ALLOWED_HOSTS = [window.location.origin]

window.addEventListener('message', function (event) {
  var message = event.data
  var origin = event.origin
  var ports = event.ports

  function withRestrictedOrigin (handler) {
    return function () {
      if (ALLOWED_HOSTS.indexOf(origin) === -1) {
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
          console.log('Find out more at "https://www.offen.dev".')
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
          console.log('You can access and manage all of your personal data or opt-out at "' + process.env.AUDITORIUM_HOST + '".')
          console.log('Find out more at "https://www.offen.dev".')
          return handleAnalyticsEvent.apply(null, [].slice.call(arguments))
        }
      }
      break
    }
    case 'QUERY':
      handler = withRestrictedOrigin(handleQuery)
      break
    case 'LOGIN':
      handler = withRestrictedOrigin(handleLogin)
      break
    case 'PURGE':
      handler = withRestrictedOrigin(handlePurge)
      break
    case 'OPTOUT':
      handler = withRestrictedOrigin(handleOptout)
      break
    case 'OPTOUT_STATUS':
      handler = withRestrictedOrigin(handleOptoutStatus)
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
