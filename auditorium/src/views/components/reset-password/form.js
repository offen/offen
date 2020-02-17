/** @jsx h */
const { h } = require('preact')

const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')

const Form = (props) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    props.onResetPassword({
      emailAddress: formData.get('email-address'),
      password: formData.get('password'),
      token: formData.get('token')
    })
  }
  return (
    <div class='bg-black-05 pa3'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Reset password')}
      </h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <LabeledInput
          name='email-address'
          type='email'
          required
          autoFocus
        >
          {__('Email address')}
        </LabeledInput>
        <LabeledInput
          class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
          name='password'
          type='password'
          required
        >
          {__('New password')}
        </LabeledInput>
        <LabeledInput
          name='password-repeat'
          type='password'
          required
        >
          {__('Repeat new password')}
        </LabeledInput>
        <SubmitButton>
          {__('Reset Password')}
        </SubmitButton>
        <input type='hidden' name='token' value={props.token} />
      </form>
    </div>
  )
}

module.exports = Form
