/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { connect } = require('react-redux')

const AccountPicker = require('./components/console/account-picker')
const Logout = require('./components/console/logout')
const CreateAccount = require('./components/console/create-account')
const ChangeEmail = require('./components/console/change-email')
const ShareAccounts = require('./components/console/share-accounts')
const ChangePassword = require('./components/console/change-password')
const Header = require('./components/console/header')
const withTitle = require('./components/_shared/with-title')
const withAuth = require('./components/_shared/with-auth')
const withLayout = require('./components/_shared/with-layout')
const authentication = require('./../action-creators/authentication')
const management = require('./../action-creators/management')
const errors = require('./../action-creators/errors')

const ConsoleView = (props) => {
  return (
    <Fragment>
      <Header
        isOperator
      />
      <div class='w-100 br0 br2-ns mb2 mt4'>
        <AccountPicker
          accounts={props.authenticatedUser.accounts}
        />
      </div>
      {Array.isArray(props.authenticatedUser.accounts) && props.authenticatedUser.accounts.length
        ? (
          <div class='w-100 br0 br2-ns mb2'>
            <ShareAccounts
              onShare={props.handleShare}
              onValidationError={props.handleValidationError}
            />
          </div>
        )
        : null}
      <div class='w-100 br0 br2-ns mb2'>
        <CreateAccount
          onCreateAccount={props.handleCreateAccount}
        />
      </div>
      <div class='w-100 br0 br2-ns mb2'>
        <ChangeEmail
          onChangeEmail={props.handleChangeEmail}
        />
      </div>
      <div class='w-100 br0 br2-ns mb2'>
        <ChangePassword
          onChangePassword={props.handleChangePassword}
          onValidationError={props.handleValidationError}
        />
      </div>
      <div class='w-100 br0 br2-ns mb2'>
        <Logout
          onLogout={props.handleLogout}
        />
      </div>
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  authenticatedUser: state.authenticatedUser
})

const mapDispatchToProps = {
  handleChangeEmail: authentication.changeCredentials,
  handleChangePassword: authentication.changeCredentials,
  handleShare: management.shareAccount,
  handleLogout: authentication.logout,
  handleCreateAccount: management.createAccount,
  handleValidationError: errors.formValidation
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(
  withLayout()(
    withAuth('/login/')(
      withTitle(__('Console | Offen'))(
        ConsoleView
      )
    )
  )
)
