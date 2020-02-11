/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const authentication = require('./../action-creators/authentication')

const ResetPasswordView = (props) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    props.handleReset({
      emailAddress: formData.get('email-address'),
      password: formData.get('password'),
      token: formData.get('token')
    })
  }
  return (
    <div class='w-100 pa3 mt4 mb2 br0 br2-ns bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Reset password')}
      </h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <label class='lh-copy'>
          {__('Email address')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            name='email-address'
            type='email'
            required
            autoFocus
          />
        </label>
        <label class='lh-copy'>
          {__('New password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            name='password'
            type='password'
            required
            autoFocus
          />
        </label>
        <label class='lh-copy'>
          {__('Repeat new password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            name='password-repeat'
            type='password'
            required
            autoFocus
          />
        </label>
        <input
          class='pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray'
          type='submit'
          value={__('Reset Password')}
        />
        <input type='hidden' name='token' value={props.token} />
      </form>
    </div>
  )
}

const mapDispatchToProps = {
  handleReset: authentication.resetPassword
}

module.exports = connect(null, mapDispatchToProps)(ResetPasswordView)
