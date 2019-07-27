var html = require('choo/html')

module.exports = view

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit('offen:login', {
      username: formData.get('username'),
      password: formData.get('password')
    })
  }
  var form = html`
    <form onsubmit=${handleSubmit}>
      <label class="login-form-label">
        <span>Username:</span>
        <input required type="text" name="username" placeholder="Username">
      </label class="login-form-label">
      <label>
        <span>Password:</span>
        <input required type="password" name="password" placeholder="Password">
      </label>
      <label class="login-form-label">
        <input type="submit">
      </label>
    </form>
  `

  return form
}
