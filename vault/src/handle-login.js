var api = require('./api')

module.exports = handleLogin

function handleLogin (message) {
  var credentials = (message.payload && message.payload.credentials) || null

  return api.login(credentials)
    .then(function (response) {
      return {
        type: 'LOGIN_SUCCESS',
        payload: response
      }
    })
    .catch(function (err) {
      if (err.status === 401) {
        return {
          type: 'LOGIN_FAILURE',
          payload: {
            message: err.message
          }
        }
      }
      throw err
    })
}
