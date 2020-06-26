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
    setIsDisabled(true)
    props.onResetPassword({
      emailAddress: formData.get('email-address'),
      password: formData.get('password'),
      token: formData.get('token')
    },
    null,
    __('There has been an error resetting your password. Please try again.')
    )
      .then(() => setIsDisabled(false))
  }
  return (
    <div class='bg-black-05 pa3'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Reset password')}
      </h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <LabeledInput
          name='email-address'
          type='email'
          required
          ref={ref}
          disabled={isDisabled}
        >
          {__('Email address')}
        </LabeledInput>
        <NewPasswordInput
          class='w-100 pa2 input-reset ba br1 b--gray bg-white'
          name='password'
          required
          disabled={isDisabled}
        >
          {__('New password')}
        </NewPasswordInput>
        <LabeledInput
          name='password-repeat'
          type='password'
          required
          disabled={isDisabled}
        >
          {__('Repeat new password')}
        </LabeledInput>
        <SubmitButton disabled={isDisabled}>
          {__('Reset Password')}
        </SubmitButton>
        <input type='hidden' name='token' value={props.token} />
      </form>
    </div>
  )
})

module.exports = Form
