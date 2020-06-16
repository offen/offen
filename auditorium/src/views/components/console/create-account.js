/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { useState } = require('preact/hooks')

const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')
const MultiStepForm = require('./../_shared/multi-step-form')

const CreateAccount = (props) => {
  const [isDisabled, setIsDisabled] = useState(false)
  function handleSubmit (formData, resetForm) {
    setIsDisabled(true)
    props.onCreateAccount(
      {
        accountName: formData['account-name'],
        emailAddress: formData['email-address'],
        password: formData.password
      },
      __('Log in again to use the newly created account <em class="%s">"%s"</em>.', 'i tracked', formData['account-name']),
      __('There was an error creating the account, please try again.')
    )
      .then(() => {
        setIsDisabled(false)
        resetForm()
      })
  }

  return (
    <div class='pa3 bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Create new account')}
      </h4>
      <MultiStepForm
        class='mw6 center mb4'
        onsubmit={handleSubmit}
        steps={[
          (props) => {
            return (
              <Fragment>
                <LabeledInput
                  name='account-name'
                  required
                  disabled={isDisabled}
                  autocomplete='off'
                >
                  {__('Account name')}
                </LabeledInput>
                <SubmitButton disabled={isDisabled}>
                  {__('Create account')}
                </SubmitButton>
              </Fragment>
            )
          },
          (props, autoFocusRef) => {
            return (
              <Fragment>
                <h5>
                  {__('You need to confirm this action with your credentials')}
                </h5>
                <LabeledInput
                  ref={autoFocusRef}
                  type='email'
                  name='email-address'
                  required
                  disabled={isDisabled}
                >
                  {__('Your email')}
                </LabeledInput>
                <LabeledInput
                  type='password'
                  name='password'
                  required
                  disabled={isDisabled}
                >
                  {__('Your password')}
                </LabeledInput>
                <SubmitButton disabled={isDisabled}>
                  {__('Confirm')}
                </SubmitButton>
                <SubmitButton
                  disabled={isDisabled}
                  onClick={props.onCancel}
                  disabledCopy={__('Cancel')}
                >
                  {__('Cancel')}
                </SubmitButton>
              </Fragment>
            )
          }
        ]}
      />
    </div>
  )
}

module.exports = CreateAccount
