/** @jsx h */
const { h } = require('preact')

const LabeledInput = require('./../shared/labeled-input')
const SubmitButton = require('./../shared/submit-button')

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
        <LabeledInput
          type='email'
          name='email-address'
          required
        >
          {__('New email address')}
        </LabeledInput>
        <LabeledInput
          type='password'
          name='password'
          required
        >
          {__('Password')}
        </LabeledInput>
        <SubmitButton>
          {__('Change email address')}
        </SubmitButton>
      </form>
    </div>
  )
}

module.exports = ChangeEmail
