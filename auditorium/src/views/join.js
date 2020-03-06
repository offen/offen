/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const management = require('./../action-creators/management')
const errors = require('./../action-creators/errors')
const Form = require('./components/join/form')
const withLayout = require('./components/_shared/with-layout')
const useAutofocus = require('./components/_shared/use-autofocus')

const JoinView = (props) => {
  const autofocusRef = useAutofocus()
  const { handleJoin, handleValidationError, token } = props
  return (
    <div class='w-100 mt4 mb2 br0 br2-ns'>
      <Form
        onJoin={handleJoin}
        onValidationError={handleValidationError}
        ref={autofocusRef}
        token={token}
      />
    </div>
  )
}

const mapDispatchToProps = {
  handleValidationError: errors.formValidation,
  handleJoin: management.join
}

module.exports = connect(null, mapDispatchToProps)(
  withLayout()(
    JoinView
  )
)
