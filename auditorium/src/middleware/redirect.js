const { route } = require('preact-router')

module.exports = (store) => (next) => (action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      next(action)
      if (!Array.isArray(action.payload.accounts) || !action.payload.accounts.length) {
        route('/console/')
        return
      }
      route(`/auditorium/${action.payload.accounts[0].accountId}`)
      return
    case 'AUTHENTICATION_FAILURE':
    case 'LOGOUT_SUCCESS':
    case 'RESET_PASSWORD_SUCCESS':
    case 'CHANGE_CREDENTIALS_SUCCESS':
    case 'CREATE_ACCOUNT_SUCCESS':
    case 'RETIRE_ACCOUNT_SUCCESS':
    case 'JOIN_SUCCESS':
      next(action)
      route('/login/')
      return
    default:
      next(action)
  }
}
