/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { forwardRef } = require('preact/compat')
const { useState } = require('preact/hooks')

const LabeledInput = require('./../_shared/labeled-input')
const SubmitButton = require('./../_shared/submit-button')

const Form = forwardRef((props, ref) => {
  const [isDisabled, setIsDisabled] = useState(false)
  function handleSubmit (e) {
    e.preventDefault()
    var formData = new window.FormData(e.currentTarget)
    setIsDisabled(true)
    props.onForgotPassword(
      {
        emailAddress: formData.get('email-address'),
        urlTemplate: window.location.origin + '/reset-password/{token}/'
      },
      __('Check your inbox and follow the instructions in the email.'),
      __('Could not handle your request, please try again.')
    )
      .then(() => setIsDisabled(false))
  }

  return (
    <div class='pa3 bg-black-05'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Request link to reset password')}
      </h4>
      <form class='mw6 center' onsubmit={handleSubmit}>
        <LabeledInput
          class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
          name='email-address'
          type='email'
          ref={ref}
          required
          disabled={isDisabled}
        >
          {__('Email address')}
        </LabeledInput>
        <SubmitButton disabled={isDisabled}>
          {__('Send Email')}
        </SubmitButton>
      </form>
    </div>
  )
})

module.exports = Form
