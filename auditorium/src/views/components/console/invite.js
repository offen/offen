/** @jsx h */
const { h } = require('preact')

const InviteUser = require('./../shared/invite-user')

const Invite = (props) => {
  return (
    <InviteUser
      {...props}
      headline={__('Invite someone to all accounts')}
    />
  )
}

module.exports = Invite
