/** @jsx h */
const { h } = require('preact')
const { useEffect } = require('preact/hooks')
const { connect } = require('react-redux')

const withLayout = require('./components/_shared/with-layout')
const useAutofocus = require('./components/_shared/use-autofocus')
const HighlightBox = require('./components/_shared/highlight-box')
const Form = require('./components/setup/form')
const errors = require('./../action-creators/errors')
const setup = require('./../action-creators/setup')

const SetupView = (props) => {
  const { handleValidationError, handleSetup, checkStatus, setupStatus = null } = props
  useEffect(() => checkStatus(__('This instance is already set up.')), [])
  if (!setupStatus) {
    return (
      <HighlightBox>
        {__('Preparing setup...')}
      </HighlightBox>
    )
  }

  const autofocusRef = useAutofocus()
  return (
    <div class='w-100 mt4 mb2 br0 br2-ns'>
      <Form
        onValidationError={handleValidationError}
        onSetup={handleSetup}
        ref={autofocusRef}
      />
    </div>
  )
}

const mapStateToProps = (state) => ({
  setupStatus: state.setupStatus
})

const mapDispatchToProps = {
  handleValidationError: errors.formValidation,
  handleSetup: setup.setup,
  checkStatus: setup.status
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(
  withLayout()(
    SetupView
  )
)
