var html = require('choo/html')

var withTitle = require('./decorators/with-title')

module.exports = withTitle(view, 'offen login')

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit('offen:login', {
      username: formData.get('username'),
      password: formData.get('password')
    })
  }
  return html`
    <div class="section-auditorium">
      <h1><strong>offen</strong> auditorium</h1>
      <form onsubmit=${handleSubmit}>
        <label>
          <span>Username:</span>
          <input type="text" name="username" placeholder="Username">
        </label>
        <label>
          <span>Password:</span>
          <input type="password" name="password" placeholder="Password">
        </label>
        <label>
          <input type="submit">
        </label>
      </form>
    </div>
  `
}
