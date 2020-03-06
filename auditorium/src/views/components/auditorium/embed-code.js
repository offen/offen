/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { CopyToClipboard } = require('react-copy-to-clipboard')
const classnames = require('classnames')

const Collapsible = require('./../_shared/collapsible')

const EmbedCode = (props) => {
  const { model, collapsible, onCopy } = props

  function handleCopy () {
    onCopy(__('Successfully copied embed code to clipboard.'))
  }

  const renderHeader = (props = {}) => {
    const { handleToggle = null, isCollapsed } = props
    return (
      <div class='flex flex-wrap justify-between pointer' onclick={handleToggle}>
        <h4 class='f4 normal ma0'>{__('Embed code')}</h4>
        {collapsible
          ? (
            <a role='button' class={classnames('dib', 'label-toggle', !isCollapsed ? null : 'label-toggle--rotate')} />
          )
          : null}
      </div>
    )
  }

  const renderBody = (props = {}) => (
    <div class='mw6 center mb4 mt3'>
      <p
        class='ma0 mb3'
        dangerouslySetInnerHTML={{
          __html: __('To use Offen with the account <strong>%s</strong> on your website, embed the following script on each page you want to appear in your statistics.', model.account.name)
        }}
      />
      <div class='w-100 br1 ba b--moon-gray ph2 pv2 white bg-near-black'>
        <code
          class='ma0 lh-solid word-wrap'
          dangerouslySetInnerHTML={{
            __html: `&lt;script async src="${window.location.origin}/script.js" data-account-id="${model.account.accountId}"&gt;&lt;/script&gt;`
          }}
        />
      </div>
      <CopyToClipboard
        onCopy={handleCopy}
        text={
         `<script async src="${window.location.origin}/script.js" data-account-id="${model.account.accountId}"></script>`
        }
      >
        <button class='pointer w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mt3 white bg-mid-gray'>
          {__('Copy code')}
        </button>
      </CopyToClipboard>
    </div>
  )

  return (
    <div class='flex-auto pa3 bg-black-05'>
      {collapsible
        ? <Collapsible header={renderHeader} body={renderBody} />
        : (
          <Fragment>
            {renderHeader()}
            {renderBody()}
          </Fragment>
        )}
    </div>
  )
}

module.exports = EmbedCode
