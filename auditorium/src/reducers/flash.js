module.exports = (state = null, action) => {
  switch (action.type) {
    case 'AUTHENTICATION_FAILURE':
    case 'INVITE_USER_SUCCESS':
    case 'INVITE_USER_FAILURE':
    case 'JOIN_SUCCESS':
    case 'JOIN_FAILURE':
    case 'CREATE_ACCOUNT_SUCCESS':
    case 'CREATE_ACCOUNT_FAILURE':
    case 'FORM_VALIDATION_ERROR':
    case 'FORGOT_PASSWORD_SUCCESS':
    case 'FORGOT_PASSWORD_FAILURE':
    case 'CHANGE_CREDENTIALS_SUCCESS':
    case 'CHANGE_CREDENTIALS_FAILURE':
    case 'RESET_PASSWORD_SUCCESS':
    case 'RESET_PASSWORD_FAILURE':
    case 'QUERY_FAILURE':
    case 'RETIRE_ACCOUNT_SUCCESS':
    case 'RETIRE_ACCOUNT_FAILURE':
    case 'SETUP_SUCCESS':
    case 'SETUP_FAILURE':
    case 'SETUP_STATUS_HASDATA':
      if (action.payload && action.payload.flash) {
        return action.payload.flash
      }
      return state
    case 'AUTHENTICATION_SUCCESS':
    case 'QUERY_SUCCESS':
      return null
    case 'NAVIGATE':
      if (action.payload && action.payload.persistFlash) {
        return state
      }
      return null
    default:
      return state
  }
}
