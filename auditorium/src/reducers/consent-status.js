module.exports = (state = null, action) => {
  switch (action.type) {
    case 'CONSENT_STATUS_SUCCESS':
    case 'EXPRESS_CONSENT_SUCCESS':
      return action.payload
    case 'NAVIGATE':
      return null
    default:
      return state
  }
}
