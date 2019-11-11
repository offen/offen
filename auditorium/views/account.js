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
        <li class="mb1">
          <a href="./account/${account.accountId}/" class="link dim gold">${account.accountName}</a>
        </li>
      `
    })
  var accountHeader = html`
    <p class="dib pa2 black br2 bg-black-05 mt0 mb4">${__('You are logged in as ')}<strong>${__('operator.')}</strong></p>

  `

  var loggedInMessage = html`
    <div class="w-100 pa3 mb2 ba b--black-10 br2 bg-white">
      <h4 class ="f5 normal mt0 mb3 gray">${__('Choose account')}</h4>
      <ul class="list pl0 mt0 mb3">
        ${availableAccounts}
      </ul>
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
    <div class="w-100 pa3 mb2 ba b--black-10 br2 bg-white">
      <h4 class="f5 normal mt0 mb3 gray">Change email address</h4>
      <form class="mw5 center" onsubmit="${handleChangeEmail}">
        <label class="b lh-copy">
          ${__('New email address')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" type="text" name="email-address">
        <label class="b lh-copy">
          ${__('Password')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" type="password" name="password">
        <input class="w-100 f5 link dim bn ph3 pv2 mb3 dib white bg-gold" type="submit" value="${__('Change Email address')}">
      </form>
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
    <div class="w-100 pa3 mb2 ba b--black-10 br2 bg-white">
      <h4 class="f5 normal mt0 mb3 gray">Change password</h4>
      <form class="mw5 center" onsubmit="${handleChangePassword}">
        <label class="b lh-copy">
          ${__('Current password')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" type="password" name="current">
        <label class="b lh-copy">
          ${__('New password')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" type="password" name="changed">
        <label class="b lh-copy">
          ${__('Repeat new password')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" type="password" name="repeat">
        <input class="w-100 f5 link dim bn ph3 pv2 mb3 dib white bg-gold" type="submit" value="${__('Change password')}">
      </form>
    </div>
  `

  return html`
    ${accountHeader}
    ${loggedInMessage}
    ${changeEmailForm}
    ${changePasswordForm}
  `
}
