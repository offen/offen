var hasOptedOut = require('./user-optout')
var allowsCookies = require('./allows-cookies')

module.exports = handleOptoutStatus

function handleOptoutStatus (message) {
  return {
    type: 'OPTOUT_STATUS',
    payload: {
      hasOptedOut: hasOptedOut(),
      allowsCookies: allowsCookies()
    }
  }
}
