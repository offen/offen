/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const withLayout = require('./components/_shared/with-layout')
const useAutofocus = require('./components/_shared/use-autofocus')
const Form = require('./components/setup/form')
const errors = require('./../action-creators/errors')
const setup = require('./../action-creators/setup')

const SetupView = (props) => {
  const autofocusRef = useAutofocus()
  return (
    <div class='w-100 mt4 mb2 br0 br2-ns'>
      <Form
        onValidationError={props.handleValidationError}
        onSetup={props.handleSetup}
        ref={autofocusRef}
      />
    </div>
  )
}

const mapDispatchToProps = {
  handleValidationError: errors.formValidation,
  handleSetup: setup.setup
}

module.exports = connect(null, mapDispatchToProps)(
  withLayout()(
    SetupView
  )
)
