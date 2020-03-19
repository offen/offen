/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

module.exports = (props) => {
  const { marginRight, marginLeft, invert } = props
  return (
    <span
      class={
        classnames(
          'dib',
          'inline-flex',
          'items-center',
          'justify-center',
          'pa1',
          'pointer',
          'h1',
          'w1',
          'tc',
          'br-100',
          invert ? 'bg-white' : 'bg-light-yellow',
          {
            mr2: marginRight,
            ml2: marginLeft
          })
      }
    >
      <span>
        {__('e')}
      </span>
    </span>
  )
}
