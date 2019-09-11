var api = require('./api')

module.exports = handleChangePassword

function handleChangePassword (message) {
  return api
    .changePassword(message.payload.current, message.payload.changed)
    .then(function (response) {
      return {
        type: 'CHANGE_PASSWORD_SUCCESS'
      }
    })
    .catch(function (err) {
      if (err.status === 401) {
        return {
          type: 'CHANGE_PASSWORD_FAILURE',
          payload: {
            message: err.message
          }
        }
      }
      throw err
    })
}
