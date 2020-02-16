/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const management = require('./../action-creators/management')
const errors = require('./../action-creators/errors')
const LabeledInput = require('./components/shared/labeled-input')
const SubmitButton = require('./components/shared/submit-button')

const JoinView = (props) => {
  const isAddition = props.isAddition

  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (!isAddition && formData.get('password') !== formData.get('repeat-password')) {
      return props.handleValidationError(new Error(__('Passwords did not match')))
    }
    props.handleJoin(
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
    <div class='w-100 pa3 mt4 mb2 br0 br2-ns bg-black-05'>
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

const mapDispatchToProps = {
  handleValidationError: errors.formValidation,
  handleJoin: management.join
}

module.exports = connect(null, mapDispatchToProps)(JoinView)
