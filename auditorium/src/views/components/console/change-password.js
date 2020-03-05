/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')

const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')

const ChangePassword = (props) => {
  const [isDisabled, setIsDisabled] = useState(false)
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('changed') !== formData.get('repeat')) {
      props.onValidationError(
        __('Passwords did not match. Please try again.')
      )
      return
    }
    setIsDisabled(true)
    props.onChangePassword(
      {
        currentPassword: formData.get('current'),
        changedPassword: formData.get('changed')
      },
      __('Please log in again, using your new password.'),
      __('Could not change passwords. Try again.')
    )
      .then(() => setIsDisabled(false))
  }

  return (
    <div class='pa3 bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Change password')}
      </h4>
      <form class='mw6 center mb4' onsubmit={handleSubmit}>
        <LabeledInput
          type='password'
          name='current'
          required
          disabled={isDisabled}
        >
          {__('Current password')}
        </LabeledInput>
        <LabeledInput
          type='password'
          name='changed'
          required
          disabled={isDisabled}
        >
          {__('New password')}
        </LabeledInput>
        <LabeledInput
          type='password'
          name='repeat'
          required
          disabled={isDisabled}
        >
          {__('Repeat new password')}
        </LabeledInput>
        <SubmitButton disabled={isDisabled}>
          {__('Change password')}
        </SubmitButton>
      </form>
    </div>
  )
}

module.exports = ChangePassword
