/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const authentication = require('./../action-creators/authentication')
const withLayout = require('./components/_shared/with-layout')
const useAutofocus = require('./components/_shared/use-autofocus')
const Form = require('./components/login/form')

const LoginView = (props) => {
  const autofocus = useAutofocus()
  return (
    <div class='w-100 mt4 mb2 br0 br2-ns'>
      <Form
        onLogin={props.handleLogin}
        ref={autofocus}
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
