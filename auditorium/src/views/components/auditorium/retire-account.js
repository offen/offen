/** @jsx h */
const { h, Fragment } = require('preact')
const { useState } = require('preact/hooks')

const Collapsible = require('./../_shared/collapsible')
const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')
const classnames = require('classnames')

const InitialScreen = (props) => {
  const { onClick, account } = props
  return (
    <Fragment>
      <p
        class='ma0 mb1'
        dangerouslySetInnerHTML={{ __html: __('If you retire the account <strong>%s,</strong> it will not appear in your statistics anymore. Users will be able to access and manage their data for the account for another 6 months until data expires.', account.name) }}
      />
      <p class='ma0 mb3 orange'>
        {__('Danger zone! This action cannot be undone.')}
      </p>
      <SubmitButton
        onclick={onClick}
      >
        {__('Retire account')}
      </SubmitButton>
    </Fragment>
  )
}

const ConfirmScreen = (props) => {
  const [inputValue, setInputValue] = useState(null)
  const { onConfirm, onCancel, account, isDisabled } = props
  function handleSubmit (e) {
    e.preventDefault()
    onConfirm()
  }
  return (
    <form onsubmit={handleSubmit}>
      <p class='ma0 mb1'>
        {__('To permanently retire the account, type its name "%s" into the form below:', account.name)}
      </p>
      <LabeledInput
        required
        oninput={(e) => setInputValue(e.target.value)}
      />
      <SubmitButton
        disabledCopy={inputValue !== account.name ? __('Confirm') : null}
        disabled={isDisabled || inputValue !== account.name}
      >
        {__('Confirm')}
      </SubmitButton>
      <SubmitButton
        onclick={onCancel}
        disabledCopy={__('Cancel')}
        disabled={isDisabled}
        type='button'
      >
        {__('Cancel')}
      </SubmitButton>
    </form>
  )
}

const RetireAccount = (props) => {
  const { account } = props
  const [isDisabled, setIsDisabled] = useState(false)
  const [isConfirmStep, setIsConfirmStep] = useState(false)
  function handleClick () {
    setIsDisabled(true)
    props.onRetire(
      { accountId: account.accountId },
      __('The account "%s" has been retired successfully. Log in again to continue.', account.name),
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
              {(() => {
                if (isConfirmStep) {
                  return (
                    <ConfirmScreen
                      {...props}
                      account={account}
                      isDisabled={isDisabled}
                      onConfirm={handleClick}
                      onCancel={() => setIsConfirmStep(false)}
                    />
                  )
                }
                return (
                  <InitialScreen
                    {...props}
                    account={account}
                    onClick={() => setIsConfirmStep(true)}
                  />
                )
              })()}
            </div>

          )
        }}
      />
    </div>
  )
}

module.exports = RetireAccount
