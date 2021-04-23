/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const sf = require('sheetify')
const { useState, useRef, useEffect } = require('preact/hooks')
const classnames = require('classnames')
const Editor = require('react-simple-code-editor').default
const { highlight, languages } = require('prismjs/components/prism-core')
const consentBanner = require('offen/consent-banner')

const SubmitButton = require('./../_shared/submit-button')
const Paragraph = require('./../_shared/paragraph')
const Collapsible = require('./../_shared/collapsible')

require('prismjs/components/prism-css')
sf('prismjs/themes/prism.css')

const AccountStylesEditor = (props) => {
  const { accountStyles = '' } = props
  const [code, setCode] = useState(accountStyles)
  const [preview, setPreview] = useState(accountStyles)

  useEffect(function updateInitialState () {
    setCode(accountStyles)
    setPreview(accountStyles)
  }, [accountStyles])

  function handleSubmit (styles) {
    props.onUpdate(
      { accountId: props.accountId, accountStyles: styles },
      __('Successfully updated styles for account %s', props.accountName),
      __("An error occured updating the account's styles.")
    )
  }

  function handlePreview (styles) {
    setPreview(styles)
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
          const iframe1 = useRef(null)
          const iframe2 = useRef(null)
          useEffect(function renderIframedPreview () {
            for (const [ref, param] of [[iframe1, false], [iframe2, true]]) {
              if (ref.current) {
                const body = ref.current.contentDocument.body
                body.firstChild && body.removeChild(body.firstChild)
                body.appendChild(
                  consentBanner.bannerView({
                    previewStyles: preview,
                    consentGiven: param
                  })
                )
              }
            }
          }, [preview])
          return (
            <div class='mw6 center ph3 mt3 mb4'>
              <Paragraph class='ma0 mb3'>
                {__('Apply custom styling to the consent banner for this account. Refer to the <a class="%s" href="%s" target="_blank" rel="noopener">documentation</a> for an in-depth guide on how to do this.', 'link"', 'https://docs.offen.dev')}
              </Paragraph>
              <div class='mb3'>
                <iframe frameborder='0' scrolling='no' width='100%' ref={iframe1} />
              </div>
              <div class='mb3'>
                <iframe frameborder='0' scrolling='no' width='100%' ref={iframe2} />
              </div>
              <div class='mb3'>
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
              </div>
              <div class='link dim'>
                <SubmitButton
                  onclick={() => handlePreview(code)}
                >
                  {__('Render preview')}
                </SubmitButton>
              </div>
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
