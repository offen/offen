/** @jsx h */
const { h } = require('preact')

const Invite = (props) => {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    var invitee = formData.get('invitee')
    var emailAddress = formData.get('email-address')

    if (invitee === emailAddress) {
      props.onValidationError(
        new Error(__('You cannot invite yourself'))
      )
      return
    }

    props.onInvite(
      {
        invitee: invitee,
        emailAddress: emailAddress,
        password: formData.get('password'),
        urlTemplate: window.location.origin + '/join/{userId}/{token}/'
      },
      __('An invite email has been sent.'),
      __('There was an error inviting the user, please try again.')
    )
  }

  return (
    <div class='w-100 pa3 mb2 br0 br2-ns bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Invite someone to all accounts')}
      </h4>
      <form class='mw6 center mb4' onsubmit={handleSubmit}>
        <label class='lh-copy'>
          {__('Email Address to send invite to')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='email'
            name='invitee'
            required
          />
        </label>
        <hr />
        <h5>
          {__('You need to confirm this action with your credentials')}
        </h5>
        <label class='lh-copy'>
          {__('Your Email')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='email'
            name='email-address'
            required
          />
        </label>
        <label class='lh-copy'>
          {__('Your Password')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            type='password'
            name='password'
            required
          />
        </label>
        <input
          class='pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray'
          type='submit'
          value={__('Invite User')}
        />
      </form>
    </div>
  )
}

module.exports = Invite
