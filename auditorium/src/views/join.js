/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const management = require('./../action-creators/management')
const errors = require('./../action-creators/errors')

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
        <label class='b lh-copy'>
          {__('Email address')}
          <input
            name='email-address'
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            required
            autoFocus
          />
        </label>
        <label class='b lh-copy'>
          {__('Password')}
          <input
            name='password'
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='password'
            required
          />
        </label>
        {!isAddition ? (
          <label class='b lh-copy'>
            {__('Repeat password')}
            <input
              name='repeat-password'
              class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
              type='password'
              required
            />
          </label>
        ) : null}
        <input
          class='pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray'
          type='submit'
          value={__('Accept invite')}
        />
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
