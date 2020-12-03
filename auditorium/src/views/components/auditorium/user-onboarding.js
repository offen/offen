/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')

const UserOnboarding = (props) => {
  const { onComplete } = props
  return (
    <Fragment>
      <h1>{__('Onboarding placeholder')}</h1>
      <a
        class='pointer'
        role='button'
        onclick={onComplete}
      >
        {__('Skip')}
      </a>
    </Fragment>
  )
}

module.exports = UserOnboarding
