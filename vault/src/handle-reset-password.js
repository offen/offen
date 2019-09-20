var api = require('./api')

module.exports = handleForgotPasswordWith(api)
module.exports.handleForgotPasswordWith = handleForgotPasswordWith

function handleForgotPasswordWith (api) {
  return function (message) {
    var payload = message.payload
    return api.resetPassword(payload.emailAddress, payload.password, payload.token)
      .then(function (response) {
        return {
          type: 'RESET_PASSWORD_SUCCESS'
        }
      })
      .catch(function (err) {
        if (err.status < 500) {
          return {
            type: 'RESET_PASSWORD_FAILURE',
            payload: {
              message: err.message
            }
          }
        }
        throw err
      })
  }
}
