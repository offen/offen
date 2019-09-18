var api = require('./api')

module.exports = handleChangeCredentialsWith(api)
module.exports.handleChangeCredentialsWith = handleChangeCredentialsWith

function handleChangeCredentialsWith (api) {
  return function (message) {
    var doRequest = function () {
      return Promise.reject(new Error('Could not match message payload.'))
    }
    var payload = message.payload
    if (payload.currentPassword && payload.changedPassword) {
      doRequest = function () {
        return api.changePassword(payload.currentPassword, payload.changedPassword)
      }
    } else if (payload.emailAddress && payload.password) {
      doRequest = function () {
        return api.changeEmail(payload.emailAddress, payload.password)
      }
    }
    return doRequest()
      .then(function (response) {
        return {
          type: 'CHANGE_CREDENTIALS_SUCCESS'
        }
      })
      .catch(function (err) {
        if (err.status === 401) {
          return {
            type: 'CHANGE_CREDENTIALS_FAILURE',
            payload: {
              message: err.message
            }
          }
        }
        throw err
      })
  }
}
