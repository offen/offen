/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { forwardRef } = require('preact/compat')

const LabeledInput = forwardRef((props, ref) => {
  const { labelClass = 'lh-copy', children, ...otherProps } = props
  switch (props.type) {
    case 'checkbox':
      return (
        <div class='w-100 mb3'>
          <label class='pointer'>
            <input
              class='mr1'
              ref={ref}
              {...otherProps}
            />
            {children}
          </label>
        </div>
      )
    default:
      return (
        <label class={labelClass}>
          {children}
          <input
            autocomplete='on'
            class='w-100 pa2 mb3 input-reset ba br1 b--gray bg-white'
            type='text'
            ref={ref}
            {...otherProps}
          />
        </label>
      )
  }
})

module.exports = LabeledInput
