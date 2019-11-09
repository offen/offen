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
          <a href="./account/${account.accountId}/">${account.accountName}</a>
        </li>
      `
    })
  var accountHeader = html`
    <div class="row">
      ${__('You are logged in as')}
      <strong>${__(' operator.')}</strong>
    </div>

  `

  var loggedInMessage = html`
    <div class="row">
      <div class="card col">
        <h4>${__('Choose account')}</h4>
        <ul>
          ${availableAccounts}
        </ul>
      </div>
    </div>
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
    <div class="row">
      <div class="card">
        <h4>Change email address</h4>
        <form onsubmit="${handleChangeEmail}">
          <div class="row">
            <div class="2 col"></div>
            <div class="8 col">
              <div class="row">
                <label>
                  ${__('New email address')}
                </label>
                <input class="card w-100" type="text" name="email-address">
              </div>
              <div class="row">
                <label>
                  ${__('Password')}
                </label>
                <input class="card w-100" type="password" name="password">
              </div>
              <div class="row"></div>
              <div class="row">
                <input class="btn primary w-100" type="submit" value="${__('Change Email address')}">
              </div>
            </div>
            <div class="2 col"></div>
          </div>
        </form>
      </div>
    </div>
  `

  function handleChangePassword (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('changed') !== formData.get('repeat')) {
      return emit('offen:flash', __('Passwords did not match. Please try again.'))
    }
    emit('offen:change-credentials', {
      currentPassword: formData.get('current'),
      changedPassword: formData.get('changed')
    })
  }

  var changePasswordForm = html`
    <div class="row">
      <div class="card">
        <h4>Change password</h4>
        <form onsubmit="${handleChangePassword}">
          <div class="row">
            <div class="2 col"></div>
            <div class="8 col">
              <div class="row">
                <label>
                  ${__('Current password')}
                </label>
                <input class="card w-100" type="password" name="current">
              </div>
              <div class="row">
                <label>
                  ${__('New password')}
                </label>
                <input class="card w-100" type="password" name="changed">
              </div>
              <div class="row">
                <label>
                  ${__('Repeat new password')}
                </label>
                <input class="card w-100" type="password" name="repeat">
              </div>
              <div class="row"></div>
              <div class="row">
                <input class="btn primary w-100" type="submit" value="${__('Change password')}">
              </div>
            </div>
            <div class="2 col"></div>
          </div>
        </form>
      </div>
    </div>
  `

  return html`
    ${accountHeader}
    ${loggedInMessage}
    ${changeEmailForm}
    ${changePasswordForm}
  `
}
