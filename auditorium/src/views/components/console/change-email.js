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

const ChangeEmail = (props) => {
  const [isDisabled, setIsDisabled] = useState(false)
  function handleSubmit (formData, resetForm) {
    setIsDisabled(true)
    props.onChangeEmail(
      {
        password: formData.password,
        emailAddress: formData['email-address'],
        emailCurrent: formData['email-current']
      },
      __('Please log in again, using your updated email.'),
      __('Could not change email. Try again.')
    )
      .then(() => {
        setIsDisabled(false)
        resetForm()
      })
  }

  return (
    <div class='bg-black-05 pb4'>
      <h4 class='f4 normal pa3 ma0'>
        {__('Change email address')}
      </h4>
      <MultiStepForm
        class='mw6 center ph3 mt3'
        onsubmit={handleSubmit}
        steps={[
          (props) => {
            return (
              <Fragment>
                <LabeledInput
                  type='email'
                  name='email-address'
                  required
                  autocomplete='off'
                  disabled={isDisabled}
                >
                  {__('New email address')}
                </LabeledInput>
                <SubmitButton disabled={isDisabled}>
                  {__('Change email address')}
                </SubmitButton>
              </Fragment>
            )
          },
          (props, autoFocusRef) => {
            return (
              <Fragment>
                <h5 class='f5 i normal ma0 mb3'>
                  {__('You need to confirm this action with your credentials.')}
                </h5>
                <LabeledInput
                  type='email'
                  name='email-current'
                  required
                  disabled={isDisabled}
                >
                  {__('Current email address')}
                </LabeledInput>
                <LabeledInput
                  type='password'
                  name='password'
                  required
                  disabled={isDisabled}
                >
                  {__('Password')}
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

module.exports = ChangeEmail
