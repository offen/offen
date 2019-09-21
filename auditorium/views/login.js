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
      <label class="form-label">
        <span>Email Address:</span>
        <input required type="email" name="username" placeholder="E-Mail-Address">
      </label class="form-label">
      <label>
        <span>Password:</span>
        <input required type="password" name="password" placeholder="Password">
      </label>
      <label class="form-label">
        <input type="submit">
      </label>
    </form>
    <a href="./reset-password">Forgot password?</a>
  `

  return form
}
