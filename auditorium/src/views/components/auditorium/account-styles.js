/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const sf = require('sheetify')
const { useState } = require('preact/hooks')
const classnames = require('classnames')
const Editor = require('react-simple-code-editor').default
const { highlight, languages } = require('prismjs/components/prism-core')
const SubmitButton = require('./../_shared/submit-button')

const Collapsible = require('./../_shared/collapsible')

require('prismjs/components/prism-css')
sf('prismjs/themes/prism.css')

const AccountStylesEditor = (props) => {
  function handleSubmit (styles) {
    props.onUpdate(
      { accountId: props.accountId, accountStyles: styles },
      __('Successfully updated styles for account %s', props.accountName),
      __("An error occured updating the account's styles.")
    )
  }

  const { customStyles = '' } = props
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
                {__('Customize appearance')}
              </h4>
              <a
                aria-label={__('Toggle display of custom styling area')}
                class={classnames('dib', 'label-toggle', isCollapsed ? 'label-toggle--rotate' : null)}
              />
            </div>
          )
        }}
        body={(props) => {
          const [code, setCode] = useState(customStyles)
          return (
            <div class='mw6 center ph3 mt3 mb4'>
              <Editor
                value={code}
                onValueChange={(code) => setCode(code)}
                highlight={(code) => highlight(code, languages.css)}
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 12,
                  backgroundColor: 'white',
                  minHeight: '200px'
                }}
              />
              <div class='link dim'>
                <SubmitButton
                  onclick={() => handleSubmit(code)}
                >
                  {__('Update Styles')}
                </SubmitButton>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}

module.exports = AccountStylesEditor
