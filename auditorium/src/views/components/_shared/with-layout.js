/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { connect } = require('react-redux')
const { useEffect } = require('preact/hooks')

const HighlightBox = require('./highlight-box')
const Paragraph = require('./paragraph')
const flash = require('./../../../action-creators/flash')

const Layout = (props) => {
  useEffect(function allowFlashMessageDismissal () {
    function dismissFlash (e) {
      if (!Array.isArray(props.flash) || !props.flash.length || e.which !== 27) {
        return
      }
      props.handleExpire(props.flash[props.flash.length - 1].id)
    }
    document.addEventListener('keyup', dismissFlash)
    return function unbind () {
      document.removeEventListener('keyup', dismissFlash)
    }
  })
  return (
    <div class='f5 roboto dark-gray'>
      <div class='w-100 bg-black-05'>
        <div class='mw8 center flex pa3 pt2' id='headline'>
          <a href='/' class='dim link flex'>
            <img src='/offen-icon-black.svg' alt='Offen logo' width='37' height='40' class='ma0 mt1 mr3' />
            <h1 class='dib dark-gray f2 normal ma0 mt1'>{props.headline || __('Offen Auditorium')}</h1>
          </a>
        </div>
      </div>
      <div class='mw8 center ph0 ph3-ns pb4'>
        {props.error
          ? (
            <Fragment>
              <HighlightBox>
                {__('An error occured: %s', props.error.message)}
              </HighlightBox>
              <pre>{props.error.stack}</pre>
            </Fragment>
          )
          : props.children}
      </div>
      <div class='mw8 center flex flex-wrap flex-column flex-row-ns justify-between ph3 pb5 pb7-ns moon-gray'>
        <div class='w-100'>
          <Paragraph
            class='ma0 mb1'
          >
            {__('<a href="https://www.offen.dev/" class="%s" target="_blank" rel="noreferer noopener">Offen</a>', 'link dim light-silver')}
          </Paragraph>
        </div>
        <div class='w-100 w-60-ns pr3-ns'>
          <Paragraph
            class='ma0 mb3'
          >
            {__('Transparent web analytics<br>for everyone')}
          </Paragraph>
        </div>
        <div class='w-70 w-40-ns'>
          <Paragraph
            class='ma0'
          >
            {__('Found an issue, need help or want to add something?<br><a href="https://twitter.com/hioffen" class="%s" target="_blank" rel="noreferer noopener">Tweet,</a> <a href="mailto:hioffen@posteo.de" class="%s" target="_blank">email</a> or file an <a href="https://github.com/offen/offen" class="%s" target="_blank" rel="noreferer noopener">issue.</a>', 'link dim light-silver', 'link dim light-silver', 'link dim light-silver')}
          </Paragraph>
        </div>
      </div>
      {props.flash.length
        ? (
          <div class='fixed bottom-0 bottom-2-ns w-100 ph4-ns'>
            {props.flash.map((message) => (
              <p
                key={message.id}
                class='pointer mw6 mv0 mt3-ns center ph3 pv4 bg-light-yellow shadow-1-ns br2 b--black-10 bt bn-ns flex items-center'
                onclick={() => props.handleExpire(message.id)}
                role='alert'
              >
                <img src='/offen-icon-black.svg' alt='Offen logo' height='30' class='ma0 mr3' />
                <span
                  dangerouslySetInnerHTML={{ __html: message.content }}
                />
              </p>
            ))}
          </div>
        ) : null}
    </div>
  )
}

const withLayout = () => (OriginalComponent) => {
  const WrappedComponent = (props) => {
    const { error, flash, handleExpire, ...otherProps } = props
    return (
      <Layout error={error} flash={flash} handleExpire={handleExpire}>
        <OriginalComponent {...otherProps} />
      </Layout>
    )
  }

  const mapStateToProps = (state) => ({
    error: state.globalError,
    flash: state.flash
  })

  const mapDispatchToProps = {
    handleExpire: flash.expire
  }

  return connect(mapStateToProps, mapDispatchToProps)(WrappedComponent)
}

module.exports = withLayout
