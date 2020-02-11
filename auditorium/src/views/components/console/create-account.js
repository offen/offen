/** @jsx h */
const { h } = require('preact')

const CreateAccount = (props) => {
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    var accountName = formData.get('account-name')
    props.onCreateAccount(
      {
        accountName: accountName,
        emailAddress: formData.get('email-address'),
        password: formData.get('password')
      },
      __('Log in again to use the newly created account.'),
      __('There was an error creating the account, please try again.')
    )
  }

  return (
    <div class='w-100 pa3 mb2 br0 br2-ns bg-black-05' id='invite-multiple'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Create new Account')}
      </h4>
      <form class='mw6 center mb4' onsubmit={handleSubmit}>
        <label class='lh-copy'>
          {__('Account Name')}
          <input
            class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
            name='account-name'
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
          value={__('Create Account')}
        />
      </form>
    </div>
  )
}

module.exports = CreateAccount
