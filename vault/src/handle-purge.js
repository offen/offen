var api = require('./api')
var queries = require('./queries')

module.exports = handlePurge

function handlePurge (message, respond) {
  return Promise.all([api.purge(), queries.purge()])
    .then(function () {
      return queries.getDefaultStats(null)
    })
    .then(function (result) {
      return {
        type: 'PURGE_SUCCESS',
        payload: {
          result: result
        }
      }
    })
    .catch(function (err) {
      return {
        type: 'ERROR',
        payload: {
          error: err.message,
          stack: err.stack,
          status: err.status
        }
      }
    })
    .then(respond)
}
