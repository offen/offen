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
    case 'EVENT':
      postEvent(message.payload.accountId, message.payload.event)
        .then(function (result) {
          console.log(result)
        })
        .catch(function (err) {
          console.error(err)
        })
      break
    default:
      console.warn(`Received message of unknown type "${message.type}", skipping.`)
  }
})
