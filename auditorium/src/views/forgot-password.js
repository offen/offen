/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const authentication = require('./../action-creators/authentication')
const Form = require('./components/forgot-password/form')
const withLayout = require('./components/_shared/with-layout')
const useAutofocus = require('./components/_shared/use-autofocus')

const ForgotPasswordView = (props) => {
  const autofocusRef = useAutofocus()
  return (
    <div class='mw8 center mt4 mb2 br0 br2-ns'>
      <Form
        ref={autofocusRef}
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
