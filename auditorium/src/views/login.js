/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const authentication = require('./../action-creators/authentication')
const withLayout = require('./components/_shared/with-layout')
const useAutofocus = require('./components/_shared/use-autofocus')
const Form = require('./components/login/form')
const UserAuditorium = require('./components/login/user-auditorium')

const LoginView = (props) => {
  const autofocusRef = useAutofocus()
  return (
    <div>
      <div class='mw8 center mt4 mb2 br0 br2-ns'>
        <Form
          onLogin={props.handleLogin}
          ref={autofocusRef}
        />
      </div>
      <div class='mw8 center br0 br2-ns'>
        <UserAuditorium queryParams={props.queryParams} />
      </div>
    </div>
  )
}

const mapDispatchToProps = {
  handleLogin: authentication.login
}

const mapStateToProps = (state) => ({ queryParams: state.queryParams })

module.exports = connect(mapStateToProps, mapDispatchToProps)(
  withLayout()(
    LoginView
  )
)
