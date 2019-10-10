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
      <div class="row">
        <div class="eight columns">
          <label>
            Email Address:
          </label>
          <input class="u-full-width" required type="email" name="username" placeholder="E-Mail-Address">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <label>
            Password:
          </label>
          <input class="u-full-width" required type="password" name="password" placeholder="Password">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <input type="submit" class="u-full-width" value="Log In">
        </div>
      </div>
      <a href="./reset-password/">Forgot password?</a>
    </form>
  `

  return form
}
