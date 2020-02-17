/** @jsx h */
const { h } = require('preact')

const AccountPicker = require('./../_shared/account-picker')

module.exports = (props) => {
  return (
    <AccountPicker
      headline={__('Choose account')}
      {...props}
    />
  )
}
