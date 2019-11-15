var html = require('choo/html')

module.exports = view

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('password') !== formData.get('repeat-password')) {
      return emit('offen:flash', __('Passwords did not match. Please try again.'))
    }
    emit('offen:reset-password', {
      emailAddress: formData.get('email-address'),
      password: formData.get('password'),
      token: formData.get('token')
    })
  }
  var form = html`
    <div class="w-100 pa3 mb2 ba b--black-10 br2 bg-white">
      <h4 class="f5 normal mt0 mb3 gray">Reset password</h4>
      <form class="mw5 center" onsubmit=${handleSubmit}>
        <label class="b lh-copy">
          ${__('Email address')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" required type="email" name="email-address">
        <label class="b lh-copy">
          ${__('New password')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" required type="password" name="password">
        <label class="b lh-copy">
          ${__('Repeat new password')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" required type="password" name="repeat-password">
        <input class="w-100 f5 link dim bn ph3 pv2 mb3 dib white bg-gold" type="submit" value="${__('Reset password')}">
        <input type="hidden" name="token" value=${state.params.token}>
      </form>
    </div>
  `

  return form
}
