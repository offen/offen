/** @jsx h */
const { h } = require('preact')

const ChangeEmail = (props) => {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    props.onChangeEmail(
      {
        password: formData.get('password'),
        emailAddress: formData.get('email-address')
      },
      __('Please log in again, using your updated email.'),
      __('Could not change email. Try again.')
    )
  }

  return (
    <div class='w-100 pa3 mb2 br0 br2-ns bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Change email address')}
      </h4>
      <form class='mw6 center mb4' onsubmit={handleSubmit}>
        <label class='lh-copy'>
          {__('New email address')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='email'
            name='email-address'
            required
          />
        </label>
        <label class='lh-copy'>
          {__('Password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='password'
            name='password'
            required
          />
        </label>
        <input
          class='pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray'
          type='submit'
          value={__('Change email address')}
        />
      </form>
    </div>
  )
}

module.exports = ChangeEmail
