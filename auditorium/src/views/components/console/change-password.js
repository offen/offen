/** @jsx h */
const { h } = require('preact')

const ChangePassword = (props) => {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('changed') !== formData.get('repeat')) {
      props.onValidationError(
        __('Passwords did not match. Please try again.')
      )
      return
    }
    props.onChangePassword(
      {
        currentPassword: formData.get('current'),
        changedPassword: formData.get('changed')
      },
      __('Please log in again, using your new password.'),
      __('Could not change passwords. Try again.')
    )
  }

  return (
    <div class='w-100 pa3 mb2 br0 br2-ns bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Change password')}
      </h4>
      <form class='mw6 center mb4' onsubmit={handleSubmit}>
        <label class='lh-copy'>
          {__('Current password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='password'
            name='current'
            required
          />
        </label>
        <label class='lh-copy'>
          {__('New password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='password'
            name='changed'
            required
          />
        </label>
        <label class='lh-copy'>
          {__('Repeat new password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='password'
            name='repeat'
            required
          />
        </label>
        <input
          class='pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray'
          type='submit'
          value={__('Change password')}
        />
      </form>
    </div>
  )
}

module.exports = ChangePassword
