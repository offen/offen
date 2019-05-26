var handleAnalyticsEvent = require('./src/handle-analytics-event')
var handleQuery = require('./src/handle-query')

// This is a list of all host applications that are allowed to request data
// by adding `respondWith` to messages. It is important to keep this restricted
// to trusted applications only, otherwise decrypted event data may leak to
// third parties.
var ALLOWED_HOSTS = [process.env.AUDITORIUM_HOST]

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
      handler = handleAnalyticsEvent
      break
    }
    case 'QUERY': {
      handler = handleQuery
      break
    }
  }

  handler(message, respond).catch(function (err) {
    console.error(err)
  })
})
