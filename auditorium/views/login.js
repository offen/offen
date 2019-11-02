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
            ${__('Email Address:')}
          </label>
          <input class="u-full-width" required type="email" name="username" placeholder="${__('Email Address')}">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <label>
            ${__('Password:')}
          </label>
          <input class="u-full-width" required type="password" name="password" placeholder="${__('Password')}">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <input type="submit" class="u-full-width" value="${__('Log in')}">
        </div>
      </div>
      <a href="./reset-password/">${__('Forgot password?')}</a>
    </form>
  `

  return form
}
