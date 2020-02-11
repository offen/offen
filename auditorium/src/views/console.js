/** @jsx h */
const { h, Fragment } = require('preact')
const { connect } = require('react-redux')

const AccountPicker = require('./components/console/account-picker')
const Logout = require('./components/console/logout')
const CreateAccount = require('./components/console/create-account')
const ChangeEmail = require('./components/console/change-email')
const Invite = require('./components/console/invite')
const ChangePassword = require('./components/console/change-password')
const withTitle = require('./components/hoc/with-title')
const withAuth = require('./components/hoc/with-auth')
const authentication = require('./../action-creators/authentication')
const management = require('./../action-creators/management')
const errors = require('./../action-creators/errors')

const ConsoleView = (props) => {
  return (
    <Fragment>
      <AccountPicker
        accounts={props.authenticatedUser.accounts}
      />
      <Invite
        onInvite={props.handleInvite}
        onValidationError={props.handleValidationError}
      />
      <CreateAccount
        onCreateAccount={props.handleCreateAccount}
      />
      <ChangeEmail
        onChangeEmail={props.handleChangeEmail}
      />
      <ChangePassword
        onChangePassword={props.handleChangePassword}
        onValidationError={props.handleValidationError}
      />
      <Logout
        onLogout={props.handleLogout}
      />
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  authenticatedUser: state.authenticatedUser
})

const mapDispatchToProps = {
  handleChangeEmail: authentication.changeCredentials,
  handleChangePassword: authentication.changeCredentials,
  handleInvite: management.inviteUser,
  handleLogout: authentication.logout,
  handleCreateAccount: management.createAccount,
  handleValidationError: errors.formValidation
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(
  withAuth('/login/')(
    withTitle(__('Console | Offen'))(
      ConsoleView
    )
  )
)
