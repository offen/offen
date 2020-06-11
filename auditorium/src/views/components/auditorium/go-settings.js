/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')

const Collapsible = require('./../_shared/collapsible')
const classnames = require('classnames')

const GoSettings = (props) => {
  return (
    <div class='pa0 bg-black-05 flex-auto'>
      <Collapsible
        header={(props) => {
          const { isCollapsed, handleToggle } = props
          return (
            <div
              data-testid='auditorium/console-headline'
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
                {__('Admin console')}
              </h4>
              <a
                aria-label={__('Toggle display of Admin console navigation')}
                class={classnames('dib', 'label-toggle', isCollapsed ? 'label-toggle--rotate' : null)}
              />
            </div>
          )
        }}
        body={(props) => {
          return (
            <div class='mw6 center mb4 mt3 ph3'>
              <p class='ma0 mb3'>
                {__('Share all accounts, create a new one, change your email address and password, log out from Offen')}
              </p>
              <a
                href='/console/'
                data-testid='auditorium/console-link'
                class='w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mr0 mr2-ns mb3 mb0-ns white bg-mid-gray'
              >
                {__('Open admin console')}
              </a>
            </div>
          )
        }}
      />
    </div>
  )
}

module.exports = GoSettings
