/** @jsx h */
const { h } = require('preact')

const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')

const Form = (props) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    props.onForgotPassword(
      {
        emailAddress: formData.get('email-address'),
        urlTemplate: window.location.origin + '/reset-password/{token}/'
      },
      __('Check your inbox and follow the instructions in the email.'),
      __('Could not handle your request, please try again.')
    )
  }

  return (
    <div class='pa3 bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Request link to reset password')}
      </h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <LabeledInput
          class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
          name='email-address'
          type='email'
          required
        >
          {__('Email address')}
        </LabeledInput>
        <SubmitButton>
          {__('Send Email')}
        </SubmitButton>
      </form>
    </div>
  )
}

module.exports = Form
