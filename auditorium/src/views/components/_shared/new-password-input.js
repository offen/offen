/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { forwardRef } = require('preact/compat')
const { useState } = require('preact/hooks')
const zxcvbn = require('zxcvbn')
const classnames = require('classnames')

const strengths = [
  __('weak'),
  __('low'),
  __('ok'),
  __('strong'),
  __('very strong')
]

const StrengthMessage = (props) => {
  const { score, policyMet } = props
  if (!policyMet) {
    return (
      <Fragment>
        {__('Your password needs to be at least 8 characters long.')}
      </Fragment>
    )
  }
  return (
    <Fragment>
      {__('Password strength: %s', strengths[score])}
    </Fragment>
  )
}

const NewPasswordInput = forwardRef((props, ref) => {
  const { labelClass = null, children, ...otherProps } = props

  const [score, setScore] = useState(0)
  const [policyMet, setPolicyMet] = useState(null)

  return (
    <Fragment>
      <label class={labelClass}>
        {children}
        <input
          class='w-100 pa2 input-reset ba br1 b--gray bg-white'
          type='password'
          ref={ref}
          pattern='.{8,64}'
          oninput={(e) => {
            e.target.setCustomValidity('')
            const val = e.target.value

            const { score } = zxcvbn(val)
            setScore(score)

            if (val.length === 0) {
              setPolicyMet(null)
            } else {
              setPolicyMet(val.length >= 8)
            }
          }}
          oninvalid={(e) => {
            e.target.setCustomValidity(
              __('Your password needs to be at least 8 characters long.')
            )
          }}
          {...otherProps}
        />
        <p class='mt1 mb3'>
          <em class={classnames('i', policyMet === false ? 'dark-red' : null)}>
            <StrengthMessage score={score} policyMet={policyMet} />
          </em>
        </p>
      </label>
    </Fragment>
  )
})

module.exports = NewPasswordInput
