/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')

const Collapsible = require('./../_shared/collapsible')
const classnames = require('classnames')

const RetireAccount = (props) => {
  const { account } = props
  const [isDisabled, setIsDisabled] = useState(false)
  function handleClick () {
    setIsDisabled(true)
    props.onRetire(
      { accountId: account.accountId },
      __('The account has been retired successfully. Log in again to continue.'),
      __('There was an error retiring the account, please try again.')
    )
      .then(() => setIsDisabled(false))
  }
  return (
    <div class='pa3 bg-black-05 flex-auto'>
      <Collapsible
        header={(props) => {
          const { isCollapsed, handleToggle } = props
          return (
            <div class='flex justify-between pointer' onclick={handleToggle}>
              <h4 class='f4 normal ma0'>
                {__('Retire account')}
              </h4>
              <a role='button' class={classnames('dib', 'label-toggle', isCollapsed ? 'label-toggle--rotate' : null)} />
            </div>
          )
        }}
        body={(props) => {
          return (
            <div class='mw6 center mb4 mt3'>
              <p class='ma0 mb1'>
                {__('If you retire the account "%s", it will not appear in your statistics anymore. Users will be able to access and manage their data for the account for another 6 months until data expires.', account.name)}
              </p>
              <p class='ma0 mb3'>
                {__('This action cannot be undone.')}
              </p>
              <button
                class='pointer w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mr0 mr2-ns mb3 mb0-ns white bg-mid-gray'
                onclick={handleClick}
                disabled={isDisabled}
              >
                {__('Retire account')}
              </button>
            </div>
          )
        }}
      />
    </div>
  )
}

module.exports = RetireAccount
