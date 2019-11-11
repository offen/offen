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
    <div class="w-100 pa3 mb2 ba b--black-10 br2 bg-white">
      <form class="mw5 center" onsubmit=${handleSubmit}>
        <label class="b lh-copy">
          ${__('Email address')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" required type="email" name="username">
        <label class="b lh-copy">
          ${__('Password')}
        </label>
        <input class="w-100 pa2 mb3 input-reset ba b--black-50" required type="password" name="password">
        <input class="w-100 f5 link dim bn ph3 pv2 mb3 dib white bg-gold" type="submit" value="${__('Log in')}">
        <a class="link dim gold" href="./reset-password/">${__('Forgot password?')}</a>
      </form>
    </div>
  `

  return form
}
