var api = require('./api')

module.exports = handleChangeEmail

function handleChangeEmail (message) {
  return api
    .changeEmail(message.payload.emailAddress, message.payload.password)
    .then(function (response) {
      return {
        type: 'CHANGE_EMAIL_SUCCESS'
      }
    })
    .catch(function (err) {
      if (err.status === 401) {
        return {
          type: 'CHANGE_EMAIL_FAILURE',
          payload: {
            message: err.message
          }
        }
      }
      throw err
    })
}
