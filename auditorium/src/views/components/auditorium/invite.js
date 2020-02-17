/** @jsx h */
const { h } = require('preact')

const InviteUser = require('./../shared/invite-user')

const Invite = (props) => {
  const { model } = props
  return (
    <InviteUser
      {...props}
      collapsible
      headline={__('Share account')}
      subline={__('Share your Offen account <strong>%s</strong> via email invitation. Invited users have full access to a shared account.', model.result.account.name)}
    />
  )
}

module.exports = Invite
