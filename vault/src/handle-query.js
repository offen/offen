var getEvents = require('./get-events')

module.exports = handleQuery

function handleQuery (message, respond) {
  var query = message.payload
    ? message.payload.query
    : null

  return getEvents(query)
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
      respond(responseMessage)
    })
}
