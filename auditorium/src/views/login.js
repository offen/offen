/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const authentication = require('./../action-creators/authentication')
const withLayout = require('./components/_shared/with-layout')
const Form = require('./components/login/form')

const LoginView = (props) => {
  return (
    <div class='w-100 mt4 mb2 br0 br2-ns'>
      <Form
        onLogin={props.handleLogin}
      />
    </div>
  )
}

const mapDispatchToProps = {
  handleLogin: authentication.login
}

module.exports = connect(null, mapDispatchToProps)(
  withLayout()(
    LoginView
  )
)
