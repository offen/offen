var getUserEvents = require('./get-user-events')
var getOperatorEvents = require('./get-operator-events')

module.exports = handleQuery

function handleQuery (message, respond) {
  var query = message.payload
    ? message.payload.query
    : null

  var lookup = (query && query.accountId)
    ? getOperatorEvents(query)
    : getUserEvents(query)

  return lookup
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
          error: err.message,
          stack: err.stack
        }
      }
    })
    .then(respond)
}
