/** @jsx h */
const { h } = require('preact')

const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')

const Form = (props) => {
  const isAddition = props.isAddition

  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (!isAddition && formData.get('password') !== formData.get('repeat-password')) {
      return props.onValidationError(new Error(__('Passwords did not match')))
    }
    props.onJoin(
      {
        emailAddress: formData.get('email-address'),
        password: formData.get('password'),
        token: formData.get('token')
      },
      isAddition
        ? __('Log in again to access all accounts.')
        : __('Your account has been set up, you can now log in.'),
      __('Could not handle your request, please try again.')
    )
  }
  return (
    <div class='w-100 sbg-black-05'>
      <h4 class='f5 normal mt0 mb3'>{isAddition ? __('Accept invite') : __('Join Offen')}</h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <LabeledInput
          name='email-address'
          required
          autoFocus
        >
          {__('Email address')}
        </LabeledInput>
        <LabeledInput
          name='password'
          type='password'
          required
        >
          {__('Password')}
        </LabeledInput>
        {!isAddition ? (
          <LabeledInput
            name='repeat-password'
            type='password'
            required
          >
            {__('Repeat password')}
          </LabeledInput>
        ) : null}
        <SubmitButton>
          {__('Accept invite')}
        </SubmitButton>
        <input type='hidden' name='token' value={props.token} />
      </form>
    </div>
  )
}

module.exports = Form
