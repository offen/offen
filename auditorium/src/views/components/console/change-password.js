/** @jsx h */
const { h } = require('preact')

const LabeledInput = require('./../shared/labeled-input')
const SubmitButton = require('./../shared/submit-button')

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
        <LabeledInput
          type='password'
          name='current'
          required
        >
          {__('Current password')}
        </LabeledInput>
        <LabeledInput
          type='password'
          name='changed'
          required
        >
          {__('New password')}
        </LabeledInput>
        <LabeledInput
          type='password'
          name='repeat'
          required
        >
          {__('Repeat new password')}
        </LabeledInput>
        <SubmitButton>
          {__('Change password')}
        </SubmitButton>
      </form>
    </div>
  )
}

module.exports = ChangePassword
