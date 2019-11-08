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
        <div class="2 col"></div>
        <div class="8 col">
          <label>
            ${__('Email address')}
          </label>
          <input class="card w-100" required type="email" name="username">
        </div>
        <div class="2 col"></div>
      </div>
      <div class="row">
        <div class="2 col"></div>
        <div class="8 col">
          <label>
            ${__('Password')}
          </label>
          <input class="card w-100" required type="password" name="password">
        </div>
        <div class="2 col"></div>
      </div>
      <div class="row"></div>
      <div class="row">
        <div class="2 col"></div>
        <div class="8 col">
          <input type="submit" class="btn primary w-100" value="${__('Log in')}">
        </div>
        <div class="2 col"></div>
      </div>
      <div class="row"></div>
      <div class="row">
        <div class="2 col"></div>
        <div class="8 col">
          <a href="./reset-password/">${__('Forgot password?')}</a>
        </div>
        <div class="2 col"></div>
      </div>
    </form>
  `

  return form
}
