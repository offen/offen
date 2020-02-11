/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const authentication = require('./../action-creators/authentication')

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
        <label class='lh-copy'>
          {__('Email address')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='email'
            name='username'
            required
            autoFocus
          />
        </label>
        <label class='lh-copy'>
          {__('Password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='password'
            name='password'
            required
          />
        </label>
        <input
          class='pointer w-100 w4-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray'
          type='submit'
          value={__('Log in')}
        />
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
