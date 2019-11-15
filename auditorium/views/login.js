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
    <div class="w-100 pa3 mt4 mb2 ba b--black-10 br2 bg-white">
      <h4 class="f5 normal mt0 mb3">Log in as operator</h4>
      <form class="mw5 center" onsubmit=${handleSubmit}>
        <label class="b lh-copy">
          ${__('Email address')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" required type="email" name="username">
        <label class="b lh-copy">
          ${__('Password')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" required type="password" name="password">
        <input class="w-100 f5 link dim bn ph3 pv2 mb3 dib white bg-dark-green" type="submit" value="${__('Log in')}">
        <div class="mb3">
          <a class="link dim dark-green" href="./reset-password/">${__('Forgot password?')}</a>
        </div>
      </form>
    </div>
  `

  return form
}
