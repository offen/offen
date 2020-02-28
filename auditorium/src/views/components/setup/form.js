/** @jsx h */
const { h } = require('preact')
const { forwardRef } = require('preact/compat')

const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')

const Form = forwardRef((props, ref) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)

    if (formData.get('password') !== formData.get('password-repeat')) {
      props.onValidationError(
        new Error(__('Passwords did not match. Please try again.'))
      )
      return
    }

    props.onSetup(
      {
        emailAddress: formData.get('email-address'),
        accountName: formData.get('account-name'),
        password: formData.get('password')
      },
      __('You can now log in using the provided credentials.'),
      __('Could not handle your request, please try again.')
    )
  }

  return (
    <div class='pa3 bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Set up your instance by creating your first account')}
      </h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <LabeledInput
          name='account-name'
          ref={ref}
          required
        >
          {__('The account name')}
        </LabeledInput>
        <LabeledInput
          name='email-address'
          type='email'
          required
        >
          {__('Your email address')}
        </LabeledInput>
        <LabeledInput
          name='password'
          type='password'
          required
        >
          {__('Your password')}
        </LabeledInput>
        <LabeledInput
          name='password-repeat'
          type='password'
          required
        >
          {__('Repeat password')}
        </LabeledInput>
        <SubmitButton>
          {__('Setup instance')}
        </SubmitButton>
      </form>
    </div>
  )
})

module.exports = Form
