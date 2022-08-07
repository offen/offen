/**
 * Copyright 2022 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Container = (props) => {
  return (
    <ul class='flex flex-wrap list pl0 ma0 b--moon-gray'>
      {props.children}
    </ul>
  )
}

exports.Container = Container

const Link = (props) => {
  const { isActive, href, ...rest } = props

  let buttonClass = 'link dim dib br1 ph3 pv2 mb2 mr2 white bg-mid-gray'
  if (isActive) {
    buttonClass = 'link dim dib br1 ph3 pv2 mb2 mr2 white bg-black-30'
  }
  return (
    <li {...rest}>
      <a
        href={href}
        class={buttonClass}
        aria-current={isActive ? 'page' : 'false'}
      >
        {props.children}
      </a>
    </li>
  )
}

exports.Link = Link
