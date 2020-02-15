var html = require('choo/html')
var raw = require('choo/html/raw')

var Input = require('./../components/input')

module.exports = view

function view (state, emit) {
  var availableAccounts = state.authenticatedUser.accounts
    .slice()
    .sort(function (a, b) {
      return a.accountName.localeCompare(b.accountName)
    })
    .map(function (account) {
      return html`
        <li class="bt b--moon-gray">
          <a href="/auditorium/${account.accountId}/" class="link dim dib pv2 mt1 mb2 mr3 mid-gray">
           ${account.accountName}</a>
        </li>
      `
    })
  var accountHeader = html`
    <p class="dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow">${raw(__('You are logged in as <strong>operator.</strong>'))}</p>
  `

  var chooseAccount = html`
  <div class="w-100 pa3 mt4 mb2 br0 br2-ns bg-black-05">
    <h4 class="f4 normal mt0 mb3">Open account</h4>
    <div class="mw6 center mb4">
      <ul class="flex flex-wrap list pl0 mt0 mb3">
        ${availableAccounts}
      </ul>
    </div>
  `

  function handleChangeEmail (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit(
      'offen:change-credentials',
      {
        password: formData.get('password'),
        emailAddress: formData.get('email-address')
      },
      __('Please log in again, using your updated email.'),
      __('Could not change email. Try again.')
    )
  }

  var changeEmailForm = html`
    <div class="w-100 pa3 mb2 br0 br2-ns bg-black-05">
      <div class="flex justify-between">
        <h4 class="f4 normal mt0 mb3">${__('Change email address')}</h4>
        <a role="button" class="dib label-toggle label-toggle--rotate"></a>
      </div>
      <form class="mw6 center mb4" onsubmit="${handleChangeEmail}">
        <label class="lh-copy">
          ${__('New email address')}
          ${state.cache(Input, 'console/change-email-email', { name: 'email-address' }).render()}
        </label>
        <label class="lh-copy">
          ${__('Password')}
          ${state.cache(Input, 'console/change-email-password', { name: 'password', type: 'password' }).render()}
        </label>
        <input class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Change email address')}">
      </form>
    </div>
  `

  function handleChangePassword (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('changed') !== formData.get('repeat')) {
      state.flash = __('Passwords did not match. Please try again.')
      return emit(state.events.RENDER)
    }
    emit(
      'offen:change-credentials',
      {
        currentPassword: formData.get('current'),
        changedPassword: formData.get('changed')
      },
      __('Please log in again, using your new password.'),
      __('Could not change passwords. Try again.')
    )
  }

  var changePasswordForm = html`
    <div class="w-100 pa3 mb2 br0 br2-ns bg-black-05">
      <div class="flex justify-between">
        <h4 class="f4 normal mt0 mb3">${__('Change password')}</h4>
        <a role="button" class="dib label-toggle label-toggle--rotate"></a>
      </div>
      <form class="mw6 center mb4" onsubmit="${handleChangePassword}">
        <label class="lh-copy">
          ${__('Current password')}
          ${state.cache(Input, 'console/change-password-current', { type: 'password', name: 'current' }).render()}
        </label>
        <label class="lh-copy">
          ${__('New password')}
          ${state.cache(Input, 'console/change-password-changed', { type: 'password', name: 'changed' }).render()}
        </label>
        <label class="lh-copy">
          ${__('Repeat new password')}
          ${state.cache(Input, 'console/change-password-repeat', { type: 'password', name: 'repeat' }).render()}
        </label>
        <input class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Change password')}">
      </form>
    </div>
  `

  function handleInvite (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    var invitee = formData.get('invitee')
    var emailAddress = formData.get('email-address')

    if (invitee === emailAddress) {
      state.flash = __('You cannot invite yourself')
      emit(state.events.RENDER)
      return
    }

    emit(
      'offen:invite-user',
      {
        invitee: invitee,
        emailAddress: emailAddress,
        password: formData.get('password'),
        urlTemplate: window.location.origin + '/join/{userId}/{token}/'
      },
      __('An invite email has been sent.'),
      __('There was an error inviting the user, please try again.')
    )
  }

  var invite = html`
    <div class="w-100 pa3 mb2 br0 br2-ns bg-black-05">
      <div class="flex justify-between">
        <h4 id="share-all-accounts" class="f4 normal mt0 mb3">${__('Share all accounts')}</h4>
        <a role="button" class="dib label-toggle label-toggle--rotate"></a>
      </div>
      <form class="mw6 center mb4" onsubmit="${handleInvite}">
        <p class="ma0 mb3">
        ${__('Share your Offen accounts via email invitation. Invited users can view data and modify your accounts.')}
        </p>
        <label class="lh-copy">
          ${__('Email Address to send invite to')}
          ${state.cache(Input, 'console/invite-user-invitee', { type: 'email', name: 'invitee' }).render()}
        </label>
        <hr style="border: 0; height: 1px;" class="w-100 mt3 mb3 bg-moon-gray">
        <h5 class="f5 normal ma0 mb3 silver">${__('Confirm with your credentials')}</h5>
        <label class="lh-copy">
          ${__('Your Email')}
          ${state.cache(Input, 'console/invite-user-email', { type: 'email', name: 'email-address' }).render()}
        </label>
        <label class="lh-copy">
          ${__('Your Password')}
          ${state.cache(Input, 'console/invite-user-password', { type: 'password', name: 'password' }).render()}
        </label>
        <input class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Invite user')}">
      </form>
    </div>
  `

  function handleCreateAccount (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    var accountName = formData.get('account-name')
    emit(
      'offen:create-account',
      {
        accountName: accountName,
        emailAddress: formData.get('email-address'),
        password: formData.get('password')
      },
      null,
      __('There was an error creating the account, please try again.'),
      function (state, emitter) {
        if (state.authenticatedUser === null) {
          // this means creating the account has been successful
          state.flash = __('Log in again to use the account "%s"', accountName)
          emitter.emit('offen:logout')
        } else {
          state.flash = __('There was an error creating the account, please try again.')
          emitter.emit(state.events.RENDER)
        }
      }
    )
  }

  var createAccount = html`
    <div class="w-100 pa3 mb2 br0 br2-ns bg-black-05" id="invite-multiple">
      <div class="flex justify-between">
        <h4 id="create-new-account" class="f4 normal mt0 mb3">${__('Create new account')}</h4>
        <a role="button" class="dib label-toggle label-toggle--rotate"></a>
      </div>
      <form class="mw6 center mb4" onsubmit="${handleCreateAccount}">
        <label class="lh-copy">
          ${__('Account Name')}
          ${state.cache(Input, 'console/create-account-name', { name: 'account-name', required: true }).render()}
        </label>
        <hr style="border: 0; height: 1px;" class="w-100 mt3 mb3 bg-moon-gray">
        <h5 class="f5 normal ma0 mb3 silver">${__('Confirm with your credentials')}</h5>
        <label class="lh-copy">
          ${__('Your Email')}
          ${state.cache(Input, 'console/create-account-email', { type: 'email', name: 'email-address', required: true }).render()}
        </label>
        <label class="lh-copy">
          ${__('Your Password')}
          ${state.cache(Input, 'console/create-account-password', { type: 'password', name: 'password', required: true }).render()}
        </label>
        <input class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Create account')}">
      </form>
    </div>
  `

  function handleLogout () {
    emit(
      'offen:logout',
      __('You have been logged out.'),
      __('There was an error terminating your session, please try again.')
    )
  }

  var logout = html`
    <div class="w-100 pa3 mb2 br0 br2-ns bg-black-05">
      <div class="mw6 center mb4">
        <div class="w-100 w-auto-ns tr-ns mt3">
          <button onclick="${handleLogout}" class="pointer w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 white bg-silver">
            ${__('Logout')}
          </button>
        </div>
      </div>
    </div>
  `

  return html`
    ${accountHeader}
    ${chooseAccount}
    ${invite}
    ${createAccount}
    ${changeEmailForm}
    ${changePasswordForm}
    ${logout}
  `
}
