var html = require('choo/html')

module.exports = view

function view (state, emit) {
  var availableAccounts = state.authenticatedUser.accounts
    .slice()
    .sort(function (a, b) {
      return a.accountName.localeCompare(b.accountName)
    })
    .map(function (account) {
      return html`
        <li>
          <a href="./account/${account.accountId}">${account.accountName}</a>
        </li>
      `
    })
  var loggedInMessage = html`
    <p>
      You can access the following accounts:
    </p>
    <ul>
      ${availableAccounts}
    </ul>
  `

  function handleChangePassword (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('changed') !== formData.get('repeat')) {
      return emit('offen:flash', 'Passwords did not match. Please try again.')
    }
    emit('offen:change-password', {
      current: formData.get('current'),
      changed: formData.get('changed')
    })
  }

  var changePasswordForm = html`
    <h2>Change Password:</h2>
    <form onsubmit="${handleChangePassword}">
      <label class="form-label">
        <span>Current password:</span>
        <input type="password" name="current">
      </label>
      <label class="form-label">
        <span>New password:</span>
        <input type="password" name="changed">
      </label>
      <label class="form-label">
        <span>Repeat new password:</span>
        <input type="password" name="repeat">
      </label>
      <label class="form-label">
        <input type="submit">
      </label>
    </form>
  `

  function handleChangeEmail (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit('offen:change-email', {
      password: formData.get('password'),
      emailAddress: formData.get('email-address')
    })
  }

  var changeEmailForm = html`
    <h2>Change email address:</h2>
    <form onsubmit="${handleChangeEmail}">
      <label class="form-label">
        <span>New email address:</span>
        <input type="text" name="email-address">
      </label>
      <label class="form-label">
        <span>Your Password:</span>
        <input type="password" name="password">
      </label>
      <label class="form-label">
        <input type="submit">
      </label>
    </form>
  `

  return html`
    ${loggedInMessage}
    ${changePasswordForm}
    ${changeEmailForm}
  `
}
