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
const SubmitButtonLight = require('./../_shared/submit-button-light')
const Paragraph = require('./../_shared/paragraph')
const Collapsible = require('./../_shared/collapsible')

require('prismjs/components/prism-css')
sf('prism-themes/themes/prism-coldark-cold.css')

const placeholderCSS = `/* ${__('Your custom CSS here')} */`

const AccountStylesEditor = (props) => {
  const { accountStyles = '', onUpdate, accountId } = props
  const [refresh, setRefresh] = useState(0)

  return (
    <div class='bg-black-05 flex-auto'>
      <Collapsible
        header={(props) => {
          const { isCollapsed } = props
          function handleToggle () {
            props.handleToggle()
            setRefresh(refresh + 1)
          }
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
          function handleSubmit (styles) {
            onUpdate(
              { accountId: accountId, accountStyles: styles },
              __('Successfully updated styles for account %s', props.accountName),
              __("An error occured updating the account's styles.")
            )
          }

          function handlePreview (styles) {
            onUpdate(
              { accountId: accountId, accountStyles: styles, dryRun: true },
              null,
              __('Could not validate your styles. Check the documentation for limitations around external URLs and other areas.')
            )
              .then(function (success) {
                if (!success) {
                  return
                }
                setPreview(styles)
              })
          }
          const [code, setCode] = useState(accountStyles || placeholderCSS)
          const [preview, setPreview] = useState(accountStyles)

          const iframe1 = useRef(null)
          const iframe2 = useRef(null)
          useEffect(function renderIframedPreview () {
            const previews = [
              [iframe1, false, '#account-styles-preview-1'],
              [iframe2, true, '#account-styles-preview-2']
            ]
            for (const [ref, param, selector] of previews) {
              if (ref.current) {
                setTimeout(function () {
                  const body = ref.current.contentDocument.body
                  body.firstChild && body.removeChild(body.firstChild)
                  body.appendChild(
                    consentBanner.bannerView({
                      previewStyles: preview,
                      consentGiven: param,
                      previewSelector: selector
                    })
                  )
                }, 7)
              }
            }
          }, [preview, refresh])
          return (
            <div class='mw6 center ph3 mt3 mb4'>
              <Paragraph class='ma0 mb3'>
                {__('Customise the styling of the consent banners for this account. Basic CSS is allowed, except for things like external URLs, injected content or transparencies.')}
              </Paragraph>
              <Paragraph class='ma0 mb4'>
                {__('<a class="%s" href="%s" target="_blank" rel="noopener">Read the Docs – Customize appearence</a>', 'b link dim dark-green', 'https://docs.offen.dev')}
              </Paragraph>
              <div class='bg-white br1 br--top pa3'>
                <Paragraph class='gray ma0 mb3'>
                  {__('Preview')}
                </Paragraph>
                <iframe
                  class='mb3'
                  id='account-styles-preview-1'
                  frameborder='0'
                  scrolling='no'
                  width='100%'
                  ref={iframe1}
                />
                <iframe
                  class='mb3'
                  id='account-styles-preview-2'
                  frameborder='0'
                  scrolling='no'
                  width='100%'
                  ref={iframe2}
                />
              </div>
              <div class='br1 br--bottom'>
                <Editor
                  value={code}
                  onValueChange={(code) => setCode(code)}
                  highlight={(code) => highlight(code, languages.css)}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 14,
                    backgroundColor: '#e5e2d3',
                    minHeight: '200px'
                  }}
                />
              </div>
              <div class='link dim mv3'>
                <SubmitButtonLight
                  onclick={() => handlePreview(code)}
                >
                  {__('Update preview')}
                </SubmitButtonLight>
              </div>
              <div class='bt b--black-10'>
                <Paragraph class='ma0 mv3'>
                  {__('Apply your custom styles to the consent banners for this account. Changes will be visible after a chache update (up to 5 minutes) and a browser refresh.')}
                </Paragraph>
                <div class='link dim'>
                  <SubmitButton
                    onclick={() => handleSubmit(code)}
                  >
                    {__('Apply styles')}
                  </SubmitButton>
                </div>
              </div>
            </div>
          )
        }}
      />
    </div>
  )
}

module.exports = AccountStylesEditor
