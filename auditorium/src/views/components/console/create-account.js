/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')

const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')

const CreateAccount = (props) => {
  const [isDisabled, setIsDisabled] = useState(false)
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    var accountName = formData.get('account-name')
    setIsDisabled(true)
    props.onCreateAccount(
      {
        accountName: accountName,
        emailAddress: formData.get('email-address'),
        password: formData.get('password')
      },
      __('Log in again to use the newly created account.'),
      __('There was an error creating the account, please try again.')
    )
      .then(() => setIsDisabled(false))
  }

  return (
    <div class='pa3 bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Create new Account')}
      </h4>
      <form class='mw6 center mb4' onsubmit={handleSubmit}>
        <LabeledInput
          name='account-name'
          required
          disabled={isDisabled}
        >
          {__('Account Name')}
        </LabeledInput>
        <hr />
        <h5>
          {__('You need to confirm this action with your credentials')}
        </h5>
        <LabeledInput
          type='email'
          name='email-address'
          required
          disabled={isDisabled}
        >
          {__('Your Email')}
        </LabeledInput>
        <LabeledInput
          type='password'
          name='password'
          required
          disabled={isDisabled}
        >
          {__('Your Password')}
        </LabeledInput>
        <SubmitButton disabled={isDisabled}>
          {__('Create Account')}
        </SubmitButton>
      </form>
    </div>
  )
}

module.exports = CreateAccount
