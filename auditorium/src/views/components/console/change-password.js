/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')

const LabeledInput = require('./../_shared/labeled-input')
const NewPasswordInput = require('./../_shared/new-password-input')
const SubmitButton = require('./../_shared/submit-button')

const ChangePassword = (props) => {
  const [isDisabled, setIsDisabled] = useState(false)
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    if (formData.get('changed') !== formData.get('repeat')) {
      props.onValidationError(
        __('Passwords did not match. Please try again.')
      )
      return
    }
    setIsDisabled(true)
    props.onChangePassword(
      {
        currentPassword: formData.get('current'),
        changedPassword: formData.get('changed')
      },
      __('Please log in again using your new password.'),
      __('Could not change password. Try again.')
    )
      .then(() => setIsDisabled(false))
  }

  return (
    <div class='bg-black-05 pb4'>
      <h4 class='f4 normal pa3 ma0'>
        {__('Change password')}
      </h4>
      <form
        class='mw6 center ph3 mt3'
        onsubmit={handleSubmit}
        data-testid='console/reset-password/form'
      >
        <LabeledInput
          type='password'
          name='current'
          required
          disabled={isDisabled}
          data-testid='console/reset-password/current-password-input'
        >
          {__('Current password')}
        </LabeledInput>
        <NewPasswordInput
          name='changed'
          required
          autocomplete='off'
          disabled={isDisabled}
          data-testid='console/reset-password/new-password-input'
        >
          {__('New password')}
        </NewPasswordInput>
        <LabeledInput
          type='password'
          name='repeat'
          required
          autocomplete='off'
          disabled={isDisabled}
          data-testid='console/reset-password/new-password-repeat'
        >
          {__('Repeat new password')}
        </LabeledInput>
        <SubmitButton disabled={isDisabled}>
          {__('Change password')}
        </SubmitButton>
      </form>
    </div>
  )
}

module.exports = ChangePassword
