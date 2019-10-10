var html = require('choo/html')

module.exports = view

function view (state, emit) {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    emit('offen:forgot-password', {
      emailAddress: formData.get('email-address'),
      urlTemplate: window.location.href + '/{token}'
    })
  }
  var form = html`
    <form onsubmit=${handleSubmit}>
      <div class="row">
        <div class="eight columns">
          <label>
            <span>Email Address:</span>
          </label>
          <input class="u-full-width" required type="email" name="email-address" placeholder="Your email address">
        </div>
      </div>
      <div class="row">
        <div class="eight columns">
          <input type="submit" value="Send Email">
        </div>
      </div>
    </form>
  `

  return form
}
