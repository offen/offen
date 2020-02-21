/** @jsx h */
const { h } = require('preact')

const Share = require('./../_shared/share')

const ShareAccount = (props) => {
  return (
    <Share
      {...props}
      headline={__('Share account')}
      subline={__('Share your Offen account <strong>%s</strong> via email invitation. Invited users have full access to a shared account.', props.accountName)}
      collapsible
    />
  )
}

module.exports = ShareAccount
