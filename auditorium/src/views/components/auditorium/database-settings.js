/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const Collapsible = require('./../_shared/collapsible')
const SubmitButton = require('./../_shared/submit-button')

const DatabaseSettings = (props) => {
  function handleClick () {
    props.onPurge(props.accountId, __('Failed to purge local aggregates, please try again.'))
  }

  return (
    <div class='bg-black-05 flex-auto'>
      <Collapsible
        header={(props) => {
          const { isCollapsed, handleToggle } = props
          return (
            <div
              class='pa3 flex justify-between pointer'
              onclick={handleToggle}
              onkeypress={(e) => {
                if (e.which === 13) {
                  handleToggle()
                }
              }}
              tabindex='0'
              role='button'
            >
              <h4 class='f4 normal ma0'>
                {__('Database settings')}
              </h4>
              <a
                aria-label={__('Toggle display of Database settings')}
                class={classnames('dib', 'label-toggle', isCollapsed ? 'label-toggle--rotate' : null)}
              />
            </div>
          )
        }}
        body={(props) => {
          return (
            <div class='mw6 center ph3 mt3 mb4'>
              <p class='ma0 mb3'>
                {__('Purge aggregates from local database and rebuild. This operation is non-destructive and can be performed at any time.')}
              </p>
              <div class='link dim'>
                <SubmitButton
                  onclick={handleClick}
                >
                  {__('Rebuild aggregates')}
                </SubmitButton>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}

module.exports = DatabaseSettings
