/** @jsx h */
const { h } = require('preact')

const Share = require('./../_shared/share')

const ShareAccounts = (props) => {
  return (
    <Share
      {...props}
      headline={__('Invite someone to all accounts')}
    />
  )
}

module.exports = ShareAccounts
