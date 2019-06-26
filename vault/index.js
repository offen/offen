var handleAnalyticsEvent = require('./src/handle-analytics-event')
var handleQuery = require('./src/handle-query')

// This is a list of all host applications that are allowed to request data
// by adding `respondWith` to messages. It is important to keep this restricted
// to trusted applications only, otherwise decrypted event data may leak to
// third parties.
var ALLOWED_HOSTS = [process.env.AUDITORIUM_HOST]

function hasOptedOut () {
  return document.cookie && document.cookie.split(';')
    .map(function (s) {
      return s.trim()
    })
    .map(function (pair) {
      return pair.split('=')
    })
    .some(function (pair) {
      return pair[0] === 'optout'
    })
}

window.addEventListener('message', function (event) {
  var message = event.data
  var origin = event.origin

  function respond (responseMessage) {
    if (ALLOWED_HOSTS.indexOf(origin) === -1) {
      console.warn('Incoming message had untrusted origin "' + origin + '", will not respond.')
      return
    }
    responseMessage = Object.assign(
      { responseTo: message.respondWith },
      responseMessage
    )
    return event.source.postMessage(responseMessage, origin)
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
          console.log('You have opted out of data collection, no events are being recorded.')
          console.log('Find out more at "https://www.offen.dev".')
          return Promise.resolve()
        }
      } else {
        handler = function () {
          console.log('This page is using offen to collect usage statistics.')
          console.log('You can access and manage all of your personal data at "' + process.env.AUDITORIUM_HOST + '".')
          console.log('To opt out from data collection, please visit "https://www.offen.dev/opt-out"')
          console.log('Find out more at "https://www.offen.dev".')
          return handleAnalyticsEvent.apply(null, [].slice.call(arguments))
        }
      }
      break
    }
    case 'QUERY': {
      handler = handleQuery
      break
    }
  }

  handler(message, respond)
    .catch(function (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(err)
      }
    })
})
