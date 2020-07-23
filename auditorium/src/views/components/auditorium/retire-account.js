/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { useState } = require('preact/hooks')

const Collapsible = require('./../_shared/collapsible')
const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')
const Paragraph = require('./../_shared/paragraph')
const classnames = require('classnames')

const InitialScreen = (props) => {
  const { onClick, account } = props
  return (
    <Fragment>
      <Paragraph class='ma0 mb1'>
        {__('If you retire the account <em class="%s">%s,</em> it will not appear in your statistics anymore. Users will be able to access and manage their data for the account for another 6 months until data expires.', 'i tracked', account.name)}
      </Paragraph>
      <Paragraph class='ma0 mb3 dark-red'>
        {__('<em class="%s">Danger zone! This action cannot be undone.</em>', 'i')}
      </Paragraph>
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
      <Paragraph class='ma0 mb1'>
        {__('To permanently retire the account, type its name <em class="%s">"%s"</em> into the form below:', 'i tracked', account.name)}
      </Paragraph>
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
      __('The account <em class="%s">"%s"</em> has been retired successfully. Log in again to continue.', 'i tracked', account.name),
      __('There was an error retiring the account, please try again.')
    )
      .then(() => setIsDisabled(false))
  }
  return (
    <div class='pa0 bg-black-05 flex-auto'>
      <Collapsible
        header={(props) => {
          const { isCollapsed, handleToggle } = props
          return (
            <div
              class='pa3 flex justify-between pointer'
              onclick={handleToggle}
              role='button'
              onkeypress={(e) => {
                if (e.which === 13) {
                  handleToggle()
                }
              }}
              tabindex='0'
            >
              <h4 class='f4 normal ma0'>
                {__('Retire account')}
              </h4>
              <a
                class={classnames('dib', 'label-toggle', isCollapsed ? 'label-toggle--rotate' : null)}
                aria-label={__('Toggle display of Retire account functionality')}
              />
            </div>
          )
        }}
        body={(props) => {
          return (
            <div class='mw6 center mb4 mt3 ph3 ph0-ns'>
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
