var handleAnalyticsEvent = require('./src/handle-analytics-event')
var handleQuery = require('./src/handle-query')

window.addEventListener('message', function (event) {
  var message = event.data

  function respond (responseMessage) {
    responseMessage = Object.assign(
      { responseTo: message.respondWith },
      responseMessage
    )
    return event.source.postMessage(responseMessage, process.env.AUDITORIUM_HOST)
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
