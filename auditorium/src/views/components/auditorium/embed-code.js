/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { CopyToClipboard } = require('react-copy-to-clipboard')
const classnames = require('classnames')
const escapeHtml = require('escape-html')
const { useState } = require('preact/hooks')
const Collapsible = require('./../_shared/collapsible')
const Paragraph = require('./../_shared/paragraph')

const EmbedCode = (props) => {
  const { model, collapsible, onCopy } = props

  function handleCopy () {
    onCopy(__('Successfully copied embed code to clipboard.'))
  }

  function toggleScriptDisplay() {
    setActive(!useSnippetWithSRI);
  }

  const renderHeader = (props = {}) => {
    const { handleToggle = null, isCollapsed } = props  
    return (
      <div
        class='flex flex-wrap justify-between pa3'
        onclick={collapsible ? handleToggle : null}
        onkeypress={(e) => {
          if (!collapsible) {
            return
          }
          if (e.which === 13) {
            handleToggle()
          }
        }}
        role={collapsible ? 'button' : null}
        tabindex={collapsible ? '0' : '-1'}
      >
        <h4 class='f4 normal ma0'>{__('Embed code')}</h4>
        {collapsible
          ? (
            <a
              class={classnames('dib', 'label-toggle', !isCollapsed ? null : 'label-toggle--rotate')}
              aria-label={__('Toggle display of embed code')}
            />
          )
          : null}
      </div>
    )
  }

  const snippet = `<script async src="${window.location.origin}/script.js" data-account-id="${model.account.accountId}"></script>`
  const snippetWithSRI = `<script async src="${window.location.origin}/script.js" data-account-id="${model.account.accountId}" integrity="sha256-${process.env.SCRIPT_INTEGRITY_HASH}"></script>`
  const [useSnippetWithSRI, setActive] = useState(false);
  let embeddedSnipped = useSnippetWithSRI ? snippetWithSRI : snippet;
  let buttonText = useSnippetWithSRI ? __('Hide integrity hash') : __('Show with integrity hash');

  const renderBody = (props = {}) => (
    <div class='mw6 center ph3 mt3 mb4'>
      <Paragraph class='ma0 mb3'>
        {__('To use Offen with the account <em class="%s">%s</em> on your website, embed the following script on each page you want to appear in your statistics.', 'i tracked', model.account.name)}
      </Paragraph>
      <Paragraph class='ma0 mb3'>
        {__('In case you are serving multiple domains from your Offen instance, please double check that the domain in this snippet matches the target account.')}
      </Paragraph>
      <div class="flex items-end">
        <div class="w-100 tr bb b--light-gray">
          <button onClick={toggleScriptDisplay} class='pointer w-100 w-auto-ns fw1 f7 tc bn dib br1 ph2 pv1 black bg-black-10'><span class={classnames('ml2', 'dib', 'label-toggle', {'label-toggle--rotate': useSnippetWithSRI })}></span> {buttonText}</button>
        </div> 
      </div> 
      <div class='w-100 br1 ph2 pv2 bg-black-10'>
        <code
          class='ma0 lh-solid word-wrap'
          dangerouslySetInnerHTML={{
            __html: escapeHtml(embeddedSnipped)
          }}
        />
      </div>
      <CopyToClipboard
        onCopy={handleCopy}
        text={embeddedSnipped}
      >
        <div class='link dim'>
          <button class='pointer w-100 w-auto-ns f5 tc bn dib br1 ph3 pv2 mv3 white bg-mid-gray'>
            {__('Copy code')}
          </button>
        </div>
      </CopyToClipboard>
    </div>
  )

  return (
    <div class='flex-auto bg-black-05'>
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
