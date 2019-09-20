var html = require('choo/html')

module.exports = view

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit('offen:forgot-password', {
      emailAddress: formData.get('email-address')
    })
  }
  var form = html`
    <form onsubmit=${handleSubmit}>
      <label class="form-label">
        <span>Username:</span>
        <input required type="email" name="email-address" placeholder="Your email address">
      </label class="form-label">
      <label class="form-label">
        <input type="submit">
      </label>
    </form>
  `

  return form
}
