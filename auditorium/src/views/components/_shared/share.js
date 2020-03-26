/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { useState } = require('preact/hooks')
const classnames = require('classnames')

const LabeledInput = require('./labeled-input')
const SubmitButton = require('./submit-button')
const Collapsible = require('./collapsible')
const MultiStepForm = require('./multi-step-form')
const Paragraph = require('./paragraph')

const Share = (props) => {
  const { headline, subline, accountId, onValidationError, onShare, collapsible } = props
  const [isDisabled, setIsDisabled] = useState(false)
  function handleSubmit (formData, resetForm) {
    var invitee = formData.invitee
    var emailAddress = formData['email-address']

    if (invitee === emailAddress) {
      onValidationError(
        new Error(__('You cannot invite yourself'))
      )
      resetForm()
      return
    }
    setIsDisabled(true)
    onShare(
      {
        invitee: invitee,
        emailAddress: emailAddress,
        password: formData.password,
        urlTemplate: window.location.origin + '/join/{token}/',
        accountId: accountId
      },
      __('An invite email has been sent to <strong>%s</strong>.', invitee),
      __('There was an error inviting the user, please try again.')
    )
      .then(() => {
        setIsDisabled(false)
        resetForm()
      })
  }

  const renderHeader = (props = {}) => {
    const { isCollapsed, handleToggle } = props
    return (
      <div
        onclick={handleToggle}
        class={classnames('flex', 'justify-between', { pointer: collapsible })}
      >
        <h4 class='f4 normal ma0'>
          {headline}
        </h4>
        {collapsible
          ? (
            <a
              role='button'
              aria-label={__('Toggle display of account sharing')}
              class={classnames('dib', 'label-toggle', isCollapsed ? 'label-toggle--rotate' : null)}
            />
          )
          : null}
      </div>
    )
  }

  const renderBody = (props = {}) => {
    return (
      <MultiStepForm
        class='mw6 center pb4 pt3'
        onsubmit={handleSubmit}
        steps={[
          (props) => {
            return (
              <Fragment>
                {subline
                  ? (
                    <Paragraph class='ma0 mb3'>
                      {subline}
                    </Paragraph>
                  )
                  : null}
                <LabeledInput
                  type='email'
                  name='invitee'
                  required
                  disabled={isDisabled}
                >
                  {__('Email address to send invite to')}
                </LabeledInput>
                <SubmitButton
                  disabled={isDisabled}
                >
                  {__('Invite user')}
                </SubmitButton>
              </Fragment>
            )
          },
          (props, autoFocusRef) => {
            return (
              <Fragment>
                <h5 class='f5 normal ma0 mb3 silver'>
                  {__('Confirm with your credentials')}
                </h5>
                <LabeledInput
                  type='email'
                  name='email-address'
                  required
                  ref={autoFocusRef}
                  disabled={isDisabled}
                >
                  {__('Your email address')}
                </LabeledInput>
                <LabeledInput
                  type='password'
                  name='password'
                  required
                  disabled={isDisabled}
                >
                  {__('Your password')}
                </LabeledInput>
                <SubmitButton
                  disabled={isDisabled}
                >
                  {__('Confirm')}
                </SubmitButton>
                <SubmitButton
                  disabled={isDisabled}
                  disabledCopy={__('Cancel')}
                  onClick={props.onCancel}
                >
                  {__('Cancel')}
                </SubmitButton>
              </Fragment>
            )
          }
        ]}
      />
    )
  }
  return (
    <div class='pa3 bg-black-05 flex-auto'>
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

module.exports = Share
