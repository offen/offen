/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const authentication = require('./../action-creators/authentication')
const Form = require('./components/forgot-password/form')
const withLayout = require('./components/_shared/with-layout')

const ForgotPasswordView = (props) => {
  return (
    <div class='w-100 mt4 mb2 br0 br2-ns'>
      <Form
        onForgotPassword={props.handleForgotPassword}
      />
    </div>
  )
}

const mapDispatchToProps = {
  handleForgotPassword: authentication.forgotPassword
}

module.exports = connect(null, mapDispatchToProps)(
  withLayout()(ForgotPasswordView)
)
