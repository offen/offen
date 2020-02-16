/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const authentication = require('./../action-creators/authentication')
const LabeledInput = require('./components/shared/labeled-input')
const SubmitButton = require('./components/shared/submit-button')

const LoginView = (props) => {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    props.handleLogin(
      formData.get('username'),
      formData.get('password'),
      __('Could not log in using the given credentials. Try again.')
    )
  }

  return (
    <div class='w-100 pa3 mt4 mb2 br0 br2-ns bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Log in as operator')}
      </h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <LabeledInput
          type='email'
          name='username'
          required
        >
          {__('Email address')}
        </LabeledInput>
        <LabeledInput
          type='password'
          name='password'
          required
        >
          {__('Password')}
        </LabeledInput>
        <SubmitButton>
          {__('Log in')}
        </SubmitButton>
        <div class='mb3'>
          <a class='normal link dim dark-green' href='/forgot-password/'>
            {__('Forgot password?')}
          </a>
        </div>
      </form>
    </div>
  )
}

const mapDispatchToProps = {
  handleLogin: authentication.login
}

module.exports = connect(null, mapDispatchToProps)(LoginView)
