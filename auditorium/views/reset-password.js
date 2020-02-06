var html = require('choo/html')

var Input = require('./../components/input')

module.exports = view

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('password') !== formData.get('repeat-password')) {
      state.flash = __('Passwords did not match. Please try again.')
      return emit(state.events.RENDER)
    }
    emit(
      'offen:reset-password',
      {
        emailAddress: formData.get('email-address'),
        password: formData.get('password'),
        token: formData.get('token')
      },
      __('Please log in again, using your new credentials.'),
      __('Could not handle your request, please try again.')
    )
  }
  var form = html`
    <div class="w-100 pa3 mt4 mb2 br0 br2-ns bg-black-05">
      <h4 class="f5 normal mt0 mb3">Reset password</h4>
      <form class="mw6 center" onsubmit=${handleSubmit}>
        <label class="b lh-copy">
          ${__('Email address')}
          ${state.cache(Input, 'reset-password/email', { name: 'email-address', required: true, autofocus: true }).render()}
        </label>
        <label class="b lh-copy">
          ${__('New password')}
          ${state.cache(Input, 'reset-password/password', { name: 'password', type: 'password', required: true }).render()}
        </label>
        <label class="b lh-copy">
          ${__('Repeat new password')}
          ${state.cache(Input, 'reset-password/repeat', { name: 'repeat-password', type: 'password', required: true }).render()}
        </label>
        <input class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Reset password')}">
        <input type="hidden" name="token" value=${state.params.token}>
      </form>
    </div>
  `

  return form
}
