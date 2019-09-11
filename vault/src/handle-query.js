var getUserEvents = require('./get-user-events')
var getOperatorEvents = require('./get-operator-events')

module.exports = handleQuery

function handleQuery (message) {
  var query = message.payload
    ? message.payload.query
    : null

  var authenticatedUser = message.payload
    ? message.payload.authenticatedUser
    : null

  var lookup = (query && query.accountId)
    ? getOperatorEvents(query, authenticatedUser)
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
}
