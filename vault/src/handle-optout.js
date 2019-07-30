var api = require('./api')

module.exports = handleOptoutStatus

function handleOptoutStatus (message, respond) {
  var status = (message.payload && message.payload.status) || false
  return (status ? api.optout() : api.optin())
    .then(function () {
      return {
        type: 'OPTOUT_SUCCESS'
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
