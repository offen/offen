const uuidv4 = require('uuid/v4')
const postEvent = require('./src/post-event')

window.addEventListener('message', function (event) {
  let message
  try {
    message = JSON.parse(event.data)
  } catch (err) {
    console.warn('Received malformed event, skipping.')
    return
  }
  switch (message.type) {
    case 'EVENT': {
      const accountId = message.payload.accountId
      const eventData = augmentEventData(message.payload.event, accountId)
      postEvent(accountId, eventData)
        .then(function (result) {
          console.log(result)
        })
        .catch(function (err) {
          console.error(err)
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
  const lookupKey = 'session-' + accountId
  let sessionId = window.sessionStorage.getItem(lookupKey)
  if (!sessionId) {
    sessionId = uuidv4()
    window.sessionStorage.setItem(lookupKey, sessionId)
  }
  return Object.assign({}, inboundPayload, {
    timestamp: new Date(),
    sessionId: sessionId
  })
}
