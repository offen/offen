/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const SubmitButton = (props) => {
  const { children, onClick, disabled, disabledCopy, ...otherProps } = props
  return (
    <div class="link dim">
      <button
        style={{ opacity: props.disabled ? 0.7 : 1 }}
        class={classnames(
          { pointer: !disabled },
          'w-100 w-auto-ns f5 bn ph3 pv2 mb3 mr2 dib br1 white bg-mid-gray'
        )}
        type='submit'
        disabled={disabled}
        onclick={onClick ? (e) => {
          e.preventDefault()
          onClick(e)
        } : null}
        {...otherProps}
      >
        {disabled
          ? (disabledCopy || __('One moment...'))
          : children}
      </button>
    </div>
  )
}

module.exports = SubmitButton
