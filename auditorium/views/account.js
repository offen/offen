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
    emit('offen:change-credentials', {
      currentPassword: formData.get('current'),
      changedPassword: formData.get('changed')
    })
  }

  var changePasswordForm = html`
    <h5>Change password:</h5>
    <form onsubmit="${handleChangePassword}">
      <div class="row">
        <div class="eight columns">
          <label>
            Current password:
          </label>
          <input class="u-full-width" type="password" name="current">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <label>
            New password:
          </label>
          <input class="u-full-width" type="password" name="changed">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <label>
            Repeat new password:
          </label>
          <input class="u-full-width" type="password" name="repeat">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <input class="u-full-width" type="submit" value="Change password">
        </div>
      </div>
    </form>
  `

  function handleChangeEmail (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit('offen:change-credentials', {
      password: formData.get('password'),
      emailAddress: formData.get('email-address')
    })
  }

  var changeEmailForm = html`
    <h5>Change email address:</h5>
    <form onsubmit="${handleChangeEmail}">
      <div class="row">
        <div class="eight columns">
          <label>
            New email address:
          </label>
          <input class="u-full-width" type="text" name="email-address">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <label>
            Your Password:
          </label>
          <input class="u-full-width" type="password" name="password">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <input class="u-full-width" type="submit" value="Change Email address">
        </div>
      </div>
    </form>
  `

  return html`
    ${loggedInMessage}
    <hr>
    ${changePasswordForm}
    ${changeEmailForm}
  `
}
