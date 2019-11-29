var html = require('choo/html')
var raw = require('choo/html/raw')

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
          <a href="./account/${account.accountId}/" class="f5 link dim bn ph3 pv2 mr2 mb1 dib br1 white bg-mid-gray">${account.accountName}</a>
        </li>
      `
    })
  var accountHeader = html`
    <p class="dib pa2 br2 bg-black-05 mt0 mb2">${raw(__('You are logged in as <strong>operator.</strong>'))}</p>
  `

  var loggedInMessage = html`
    <div class="w-100 pa3 mt4 mb2 br2 bg-black-05">
      <h4 class ="f5 normal mt0 mb3">${__('Choose account')}</h4>
      <ul class="flex flex-wrap list pl0 mt0 mb3">
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
    <div class="w-100 pa3 mb2 br2 bg-black-05">
      <h4 class="f5 normal mt0 mb3">Change email address</h4>
      <form class="mw6 center" onsubmit="${handleChangeEmail}">
        <label class="b lh-copy">
          ${__('New email address')}
          <input class="w-100 pa2 mb3 input-reset ba b--black-10 bg-white" type="text" name="email-address">
        </label>
        <label class="b lh-copy">
          ${__('Password')}
          <input class="w-100 pa2 mb3 input-reset ba b--black-10 bg-white" type="password" name="password">
        </label>
        <input class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Change Email address')}">
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
    <div class="w-100 pa3 mb2 br2 bg-black-05">
      <h4 class="f5 normal mt0 mb3">Change password</h4>
      <form class="mw6 center" onsubmit="${handleChangePassword}">
        <label class="b lh-copy">
          ${__('Current password')}
          <input class="w-100 pa2 mb3 input-reset ba b--black-10 bg-white" type="password" name="current">
        </label>
        <label class="b lh-copy">
          ${__('New password')}
          <input class="w-100 pa2 mb3 input-reset ba b--black-10 bg-white" type="password" name="changed">
        </label>
        <label class="b lh-copy">
          ${__('Repeat new password')}
          <input class="w-100 pa2 mb3 input-reset ba b--black-10 bg-white" type="password" name="repeat">
        </label>
        <input class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Change password')}">
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
