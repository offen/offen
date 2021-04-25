/**
 * Copyright 2021 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

var html = require('nanohtml')
var raw = require('nanohtml/raw')

var styles = require('./index.css')

exports.bannerView = function (props) {
  props = props || {}
  return html`
    <div class="banner__root ${props.consentGiven ? 'banner--followup' : 'banner--initial'}">
      <link rel="stylesheet" href="/fonts.css" onload=${props.onload}>
      <style>
        ${styles}
      </style>
        ${props.consentGiven ? followupScreen(props) : initialScreen(props)}
      ${props.previewSelector
        ? html`
          <script>
            function adjustSelf () {
              var height = document.querySelector('.banner__root').getBoundingClientRect().height + 'px';
              parent.document.querySelector("${props.previewSelector}").style.height = height;
            }
            window.addEventListener('resize', adjustSelf);
            adjustSelf();
          </script>
        `
        : null
      }
      ${props.previewStyles
        ? html`
          <style>
            ${props.previewStyles}
          </style>
        `
        : null}
    </div>
  `
}

function followupScreen (props) {
  return html`
    <p class="banner__paragraph banner__paragraph--first">
      ${__('Thanks for your help to make this website better.')}
    </p>
    <p class="banner__paragraph">
      ${raw(__('To manage your usage data <a class="%s"target="_blank" rel="noopener" href="%s">open the Auditorium.</a>', 'paragraph__anchor', '/auditorium/'))}
    </p>
    <div class="banner__buttons">
      <button class="buttons__button" onclick="${props.handleClose}">
        ${__('Continue')}
      </button>
    </div>
  `
}

function initialScreen (props) {
  return html`
    <p class="banner__paragraph banner__paragraph--first">
      ${__('We only access usage data with your consent.')}
    </p>
    <p class="banner__paragraph">
      ${__('You can opt out and delete any time.')}
      <a class="paragraph__anchor" target="_blank" rel="noopener" href="/">
        ${__('Learn more')}
      </a>
    </p>
    <div class="banner__buttons">
      <button class="buttons__button buttons__button--first" onclick=${props.handleAllow}>
        ${__('I allow')}
      </button>
      <button class="buttons__button buttons__button--last" onclick=${props.handleDeny}>
        ${__("I don't allow")}
      </button>
    </div>
   `
}

exports.hostStylesVisible = function (props) {
  return html`
<style>
  ${props.selector} {
    display: block !important;
    position: fixed;
    bottom: 138px;
    right: 0;
    left: 0;
    margin: 0 auto;
    box-shadow: 0px 0px 9px 0px rgba(0,0,0,0.50);
    z-index: 2147483647;
    width: 410px;
  }
  @media all and (max-width: 414px) {
    ${props.selector} {
      width: 100%;
      border-left: none;
      border-right: none;
      border-radius: 0;
    }
  }
</style>
  `
}

exports.hostStylesHidden = function (props) {
  return html`
<style>
  ${props.selector} {
    display: none;
  }
</style>
  `
}
