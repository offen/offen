var html = require('choo/html')

var Input = require('./../components/input')

module.exports = view

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit(
      'offen:forgot-password',
      {
        emailAddress: formData.get('email-address'),
        urlTemplate: window.location.origin + '/reset-password/{token}/'
      },
      __('Check your inbox and follow the instructions in the email.'),
      __('Could not handle your request, please try again.')
    )
  }
  var form = html`
    <div class="w-100 pa3 mt4 mb2 br0 br2-ns bg-black-05">
      <h4 class="f5 normal mt0 mb3">Request link to reset password</h4>
      <form class="mw6 center" onsubmit=${handleSubmit}>
        <label class="b lh-copy">
          ${__('Email address')}
          ${state.cache(Input, 'forgot-password/email', { name: 'email-address', required: true, autofocus: true }).render()}
        </label>
        <input class="pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Send Email')}">
    </form>
  `

  return form
}
