/** @jsx h */
const { h, Fragment } = require('preact')
const classnames = require('classnames')

const LabeledInput = require('./labeled-input')
const SubmitButton = require('./submit-button')
const Collapsible = require('./collapsible')

const InviteUser = (props) => {
  const { headline, subline, accountId, onValidationError, onInvite, collapsible } = props
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

  const header = (props) => {
    const { isCollapsed } = props
    return (
      <div class={classnames('flex', 'justify-between', { pointer: collapsible })}>
        <h4 class='f4 normal ma0'>
          {headline}
        </h4>
        {collapsible
          ? (<a role='button' class={classnames('dib', 'label-toggle', isCollapsed ? null : 'label-toggle--rotate')} />)
          : null}
      </div>
    )
  }

  const body = (props) => {
    return (
      <form class='mw6 center mb4 mt3' onsubmit={handleSubmit}>
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
        <LabeledInput
          type='email'
          name='invitee'
          required
        >
          {__('Email address to send invite to')}
        </LabeledInput>
        <hr class='w-100 mt3 mb2 bt moon-gray' />
        <h5 class='f5 normal ma0 mb3 silver'>
          {__('Confirm with your credentials')}
        </h5>
        <LabeledInput
          type='email'
          name='email-address'
          required
        >
          {__('Your email address')}
        </LabeledInput>
        <LabeledInput
          type='password'
          name='password'
          required
        >
          {__('Your password')}
        </LabeledInput>
        <SubmitButton>
          {__('Invite user')}
        </SubmitButton>
      </form>
    )
  }
  return (
    <div class='w-100 pa3 mb2 br0 br2-ns bg-black-05'>
      {collapsible
        ? <Collapsible headline={header} body={body} />
        : (
          <Fragment>
            {header({})}
            {body({})}
          </Fragment>
        )}
    </div>
  )
}

module.exports = InviteUser
