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

const ADMIN_LEVEL_ALLOW_EDIT = 1

const ConsoleView = (props) => {
  const {
    authenticatedUser, handleShare, handleValidationError, handleCreateAccount,
    handleChangeEmail, handleChangePassword, handleLogout
  } = props
  const { adminLevel, accounts } = authenticatedUser
  return (
    <Fragment>
      <Header
        isOperator
      />
      <div class='mw8 center br0 br2-ns mb2 mt4'>
        <AccountPicker
          accounts={accounts}
        />
      </div>
      {Array.isArray(accounts) && accounts.length && adminLevel === ADMIN_LEVEL_ALLOW_EDIT
        ? (
          <div class='mw8 center br0 br2-ns mb2'>
            <ShareAccounts
              onShare={handleShare}
              onValidationError={handleValidationError}
            />
          </div>
        )
        : null}
      {adminLevel === ADMIN_LEVEL_ALLOW_EDIT
        ? (
          <div class='mw8 center br0 br2-ns mb2'>
            <CreateAccount
              onCreateAccount={handleCreateAccount}
            />
          </div>
        )
        : null}
      <div class='mw8 center br0 br2-ns mb2'>
        <ChangeEmail
          onChangeEmail={handleChangeEmail}
        />
      </div>
      <div class='mw8 center br0 br2-ns mb2'>
        <ChangePassword
          onChangePassword={handleChangePassword}
          onValidationError={handleValidationError}
        />
      </div>
      <div class='mw8 center br0 br2-ns mb2'>
        <Logout
          onLogout={handleLogout}
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
