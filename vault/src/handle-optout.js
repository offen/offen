var api = require('./api')

module.exports = handleOptoutStatus

function handleOptoutStatus (message) {
  var status = (message.payload && message.payload.status) || false
  return (status ? api.optout() : api.optin())
    .then(function () {
      return {
        type: 'OPTOUT_SUCCESS'
      }
    })
}
