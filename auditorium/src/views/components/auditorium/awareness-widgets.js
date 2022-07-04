/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h } = require('preact')
const { useState } = require('preact/hooks')
const { CopyToClipboard } = require('react-copy-to-clipboard')
const classnames = require('classnames')
const escapeHtml = require('escape-html')

const Collapsible = require('./../_shared/collapsible')

const HTMLWidgets = [
  {
    name: __('Bar'),
    asset: __('/user-access-widget-bar-en.svg'),
    alt: [__('Fair web analytics'), __('Access your usage data')].join(' ')
  },
  {
    name: __('Box'),
    asset: __('/user-access-widget-box-en.svg'),
    alt: [__('Fair web analytics'), __('Access your data')].join(' ')
  },
  {
    name: __('Circle'),
    asset: __('/user-access-widget-circle-en.svg'),
    alt: [__('Fair web analytics'), __('Access your data')].join(' ')
  }
]

const AwarenessWidgets = (props) => {
  const { onCopy = Function.prototype } = props

  const [selectedWidget, setSelectedWidget] = useState(HTMLWidgets[0])

  return (
    <div class='flex-auto bg-black-05'>
      <Collapsible
        header={(props) => {
          const { isCollapsed, handleToggle } = props
          return (
            <div
              class='flex justify-between pointer pa3'
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
                {__('Let users access their data')}
              </h4>
              <a
                aria-label={__('Toggle display of awareness widgets')}
                class={classnames('dib', 'label-toggle', isCollapsed ? 'label-toggle--rotate' : null)}
              />
            </div>
          )
        }}
        body={(props) => {
          const snippetContent = `<a href="${window.location.origin}/auditorium"><img alt="${selectedWidget.alt}" src="${window.location.origin}${selectedWidget.asset}"></a>`
          return (
            <div class='mw6 center ph3 mt3 mb4'>
              <p class='ma0 mb3'>
                {__('Let users access their data on every page of your website. Link directly to the User Auditorium or use the HTML widget.')}
              </p>
              <p class='ma0 mb3'>
                {__('User Auditorium link')}
              </p>
              <div class='w-100 br1 ph2 pv2 bg-black-10'>
                <code
                  class='ma0 lh-solid word-wrap'
                >
                  {window.location.origin}/auditorium/
                </code>
              </div>
              <CopyToClipboard
                onCopy={() => onCopy(__('Successfully copied link to clipboard.'))}
                text={
                 `${window.location.origin}/auditorium/`
                }
              >
                <div class='link dim'>
                  <button class='pointer w-100 w-auto-ns f5 tc bn dib br1 ph3 pv2 mt3 mb4 white bg-mid-gray'>
                    {__('Copy link')}
                  </button>
                </div>
              </CopyToClipboard>
              <div class='bt b--black-10 pt3'>
                <p class='ma0 mb3'>
                  {__('HTML Widget')}
                </p>
                <div class='mb3'>
                  {HTMLWidgets.map(function (widget) {
                    return (
                      <label key={widget.name} class='dib mr3'>
                        <input
                          onChange={() => setSelectedWidget(widget)}
                          class='dib mr1'
                          type='radio'
                          value={widget.name}
                          name='html-widget-selector'
                          checked={selectedWidget.name === widget.name}
                        />
                        {widget.name}
                      </label>
                    )
                  })}
                </div>
                <div class='bg-white br1 br--top pa3'>
                  <p class='gray ma0 mb3'>
                    {__('Preview')}
                  </p>
                  <div class='flex justify-center mb3'>
                    <img src={selectedWidget.asset} alt={selectedWidget.alt} />
                  </div>
                </div>
              </div>
              <div class='w-100 br1 ph2 pv2 bg-black-10'>
                <code
                  class='ma0 lh-solid word-wrap'
                  dangerouslySetInnerHTML={{
                    __html: escapeHtml(snippetContent)
                  }}
                />
              </div>
              <CopyToClipboard
                onCopy={() => onCopy(__('Successfully copied widget code to clipboard.'))}
                text={snippetContent}
              >
                <div class='link dim'>
                  <button class='pointer w-100 w-auto-ns f5 tc bn dib br1 ph3 pv2 mv3 white bg-mid-gray'>
                    {__('Copy widget')}
                  </button>
                </div>
              </CopyToClipboard>
            </div>
          )
        }}
      />
    </div>
  )
}

module.exports = AwarenessWidgets
