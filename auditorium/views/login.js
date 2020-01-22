var html = require('choo/html')

var Input = require('./../components/input')

module.exports = view

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit('offen:login', {
      username: formData.get('username'),
      password: formData.get('password')
    }, __('Could not log in using the given credentials. Try again.'))
  }
  var form = html`
    <div class="w-100 pa3 mt4 mb2 br0 br2-ns bg-black-05">
      <h4 class="f5 normal mt0 mb3">Log in as operator</h4>
      <form class="mw6 center" onsubmit=${handleSubmit}>
        <label class="b lh-copy">
          ${__('Email address')}
          ${state.cache(Input, 'login/username', { required: true, type: 'email', name: 'username' }).render()}
        </label>
        <label class="b lh-copy">
          ${__('Password')}
          ${state.cache(Input, 'login/password', { name: 'password', required: true, type: 'password' }).render()}
        </label>
        <input class="pointer w-100 w4-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray" type="submit" value="${__('Log in')}">
        <div class="mb3">
          <a class="normal link underline dim dark-gray" href="/reset-password/">${__('Forgot password?')}</a>
        </div>
      </form>
    </div>
  `

  return form
}
