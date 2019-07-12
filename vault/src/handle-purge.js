var api = require('./api')
var queries = require('./queries')
var handleQuery = require('./handle-query')

module.exports = handlePurge

function handlePurge (message, respond) {
  return Promise.all([api.purge(), queries.purge()])
    .then(function () {
      return handleQuery(message, respond)
    })
}
