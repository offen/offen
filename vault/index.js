var uuidv4 = require('uuid/v4')

var postEvent = require('./src/post-event')
var getEvents = require('./src/get-events')

window.addEventListener('message', function (event) {
  var message = event.data
  switch (message.type) {
    case 'EVENT': {
      var accountId = message.payload.accountId
      var eventData = augmentEventData(message.payload.event, accountId)
      postEvent(accountId, eventData)
        .then(function (result) {
          console.log(result)
        })
        .catch(function (err) {
          console.error(err)
        })
      break
    }

    case 'QUERY': {
      var query = message.payload
        ? message.payload.query
        : null

      getEvents(query)
        .then(function (result) {
          return {
            type: 'QUERY_RESULT',
            payload: {
              query: query,
              result: result
            }
          }
        })
        .catch(function (err) {
          return {
            type: 'ERROR',
            payload: {
              error: err
            }
          }
        })
        .then(function (responseMessage) {
          var withResponseId = Object.assign(
            { responseTo: message.respondWith },
            responseMessage
          )
          event.source.postMessage(
            withResponseId,
            // it is important that these messages cannot be read by
            // anyone else but the auditorium
            process.env.AUDITORIUM_HOST
          )
        })
      break
    }

    default:
      console.warn(`Received message of unknown type "${message.type}", skipping.`)
  }
})

// augmentEventData adds properties to an event that could be subject to spoofing
// or unwanted access by 3rd parties in "script". For example adding the session id
// here instead of the script prevents other scripts from reading this value.
function augmentEventData (inboundPayload, accountId) {
  // even though the session identifier will be included in the encrypted part
  // of the event we generate a unique identifier per account so that each session
  // is unique per account and cannot be cross-referenced
  var lookupKey = 'session-' + accountId
  var sessionId = window.sessionStorage.getItem(lookupKey)
  if (!sessionId) {
    sessionId = uuidv4()
    window.sessionStorage.setItem(lookupKey, sessionId)
  }
  return Object.assign({}, inboundPayload, {
    timestamp: new Date(),
    sessionId: sessionId
  })
}
