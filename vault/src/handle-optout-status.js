var hasOptedOut = require('./user-optout')

module.exports = handleOptoutStatus

function handleOptoutStatus (message, respond) {
  respond({
    type: 'OPTOUT_STATUS',
    payload: {
      hasOptedOut: hasOptedOut()
    }
  })
  return Promise.resolve()
}
