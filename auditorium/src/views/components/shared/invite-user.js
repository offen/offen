/** @jsx h */
const { h } = require('preact')

const InviteUser = (props) => {
  const { headline, subline, accountId, onValidationError, onInvite } = props
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    var invitee = formData.get('invitee')
    var emailAddress = formData.get('email-address')

    if (invitee === emailAddress) {
      onValidationError(
        new Error(__('You cannot invite yourself'))
      )
      return
    }

    onInvite(
      {
        invitee: invitee,
        emailAddress: emailAddress,
        password: formData.get('password'),
        urlTemplate: window.location.origin + '/join/{userId}/{token}/',
        accountId: accountId
      },
      __('An invite email has been sent.'),
      __('There was an error inviting the user, please try again.')
    )
  }

  return (
    <div class='w-100 pa3 mb2 br0 br2-ns bg-black-05'>
      <div class='flex justify-between'>
        <h4 class='f4 normal mt0 mb3'>
          {headline}
        </h4>
        <a role='button' class='dib label-toggle label-toggle--rotate' />
      </div>
      <form class='mw6 center mb4' onsubmit={handleSubmit}>
        {subline
          ? (
            <p
              class='ma0 mb3'
              dangerouslySetInnerHTML={{
                __html: subline
              }}
            />
          )
          : null}
        <label class='lh-copy'>
          {__('Email address to send invite to')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='email'
            name='invitee'
            required
          />
        </label>
        <hr class='w-100 mt3 mb2 bt moon-gray' />
        <h5 class='f5 normal ma0 mb3 silver'>
          {__('Confirm with your credentials')}
        </h5>
        <label class='lh-copy' id='invite-single-email'>
          {__('Your email address')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='email'
            name='email-address'
            required
          />
        </label>
        <label class='lh-copy' id='invite-single-password'>
          {__('Your password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='password'
            name='password'
            required
          />
        </label>
        <input class='pointer w-100 w-auto-ns f5 link dim bn dib br1 ph3 pv2 white bg-mid-gray' type='submit' value={__('Invite user')} />
      </form>
    </div>
  )
}

module.exports = InviteUser
