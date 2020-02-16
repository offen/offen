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
      return action.payload && action.payload.flash
    case 'NAVIGATE':
      return null
    default:
      return state
  }
}