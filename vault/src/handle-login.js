var api = require('./api')

module.exports = handleQuery

function handleQuery (message, respond) {
  var credentials = (message.payload && message.payload.credentials) || null

  return api.login(credentials)
    .then(function () {
      return {
        type: 'LOGIN_SUCCESS',
        payload: null
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
