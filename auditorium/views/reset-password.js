var html = require('choo/html')

module.exports = view

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('password') !== formData.get('repeat-password')) {
      return emit('offen:flash', 'Passwords did not match. Please try again.')
    }
    emit('offen:reset-password', {
      emailAddress: formData.get('email-address'),
      password: formData.get('password'),
      token: formData.get('token')
    })
  }
  var form = html`
    <form onsubmit=${handleSubmit}>
      <label class="form-label">
        <span>Email address:</span>
        <input required type="email" name="email-adress" placeholder="Your email address">
      </label class="form-label">
      <label class="form-label">
        <span>New password:</span>
        <input required type="password" name="password" placeholder="Your new password">
      </label class="form-label">
      <label class="form-label">
        <span>Repeat password:</span>
        <input required type="password" name="repeat-password" placeholder="Repeat password">
      </label class="form-label">
      <input type="hidden" name="token" value=${state.params.token}>
      <label class="form-label">
        <input type="submit">
      </label>
    </form>
  `

  return form
}
