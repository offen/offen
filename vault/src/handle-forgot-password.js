var api = require('./api')

module.exports = handleForgotPasswordWith(api)
module.exports.handleForgotPasswordWith = handleForgotPasswordWith

function handleForgotPasswordWith (api) {
  return function (message) {
    return api.forgotPassword(message.payload.emailAddress)
      .then(function (response) {
        return {
          type: 'FORGOT_PASSWORD_SUCCESS'
        }
      })
      .catch(function (err) {
        if (err.status < 500) {
          return {
            type: 'FORGOT_PASSWORD_FAILURE',
            payload: {
              message: err.message
            }
          }
        }
        throw err
      })
  }
}
