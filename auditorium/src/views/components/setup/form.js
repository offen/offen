/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { forwardRef } = require('preact/compat')
const { useState } = require('preact/hooks')

const LabeledInput = require('./../_shared/labeled-input')
const NewPasswordInput = require('./../_shared/new-password-input')
const SubmitButton = require('./../_shared/submit-button')

const Form = forwardRef((props, ref) => {
  const [isDisabled, setIsDisabled] = useState(false)
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)

    if (formData.get('password') !== formData.get('password-repeat')) {
      props.onValidationError(
        new Error(__('Passwords did not match. Please try again.'))
      )
      return
    }
    setIsDisabled(true)
    props.onSetup(
      {
        emailAddress: formData.get('email-address'),
        accountName: formData.get('account-name'),
        password: formData.get('password')
      },
      __('You can now log in using the provided credentials.'),
      __('Could not handle your request, please try again.')
    )
      .then(() => setIsDisabled(false))
  }

  return (
    <div class='pa3 bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Set up your instance by creating your first account')}
      </h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <LabeledInput
          name='account-name'
          ref={ref}
          required
          disabled={isDisabled}
        >
          {__('The account name')}
        </LabeledInput>
        <LabeledInput
          name='email-address'
          type='email'
          required
          disabled={isDisabled}
        >
          {__('Your email address')}
        </LabeledInput>
        <NewPasswordInput
          name='password'
          required
          disabled={isDisabled}
        >
          {__('Your password')}
        </NewPasswordInput>
        <LabeledInput
          name='password-repeat'
          type='password'
          required
          disabled={isDisabled}
        >
          {__('Repeat password')}
        </LabeledInput>
        <SubmitButton disabled={isDisabled}>
          {__('Setup instance')}
        </SubmitButton>
      </form>
    </div>
  )
})

module.exports = Form
