/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { useEffect, useState } = require('preact/hooks')
const { connect } = require('react-redux')

const withAuth = require('./components/_shared/with-auth')
const withTitle = require('./components/_shared/with-title')
const withLayout = require('./components/_shared/with-layout')
const HighlightBox = require('./components/_shared/highlight-box')
const Dots = require('./components/_shared/dots')
const Header = require('./components/auditorium/header')
const RangeSelector = require('./components/auditorium/range-selector')
const Metrics = require('./components/auditorium/metrics')
const Chart = require('./components/auditorium/chart')
const RetentionChart = require('./components/auditorium/retention-chart')
const URLTables = require('./components/auditorium/url-tables')
const EmbedCode = require('./components/auditorium/embed-code')
const Share = require('./components/auditorium/share')
const GoSettings = require('./components/auditorium/go-settings')
const DatabaseSettings = require('./components/auditorium/database-settings')
const LoadingOverlay = require('./components/auditorium/loading-overlay')
const AccountPicker = require('./components/auditorium/account-picker')
const RetireAccount = require('./components/auditorium/retire-account')
const Live = require('./components/auditorium/live')
const model = require('./../action-creators/model')
const errors = require('./../action-creators/errors')
const management = require('./../action-creators/management')
const database = require('./../action-creators/database')

const ADMIN_LEVEL_ALLOW_EDIT = 1

const AuditoriumView = (props) => {
  const {
    matches, authenticatedUser, model, stale,
    handleQuery, handleShare, handleValidationError, handleRetire, handleCopy,
    handlePurgeAggregates
  } = props
  const { accountId, range, resolution, now } = matches
  const { adminLevel } = authenticatedUser
  const [focus, setFocus] = useState(true)

  const softFailure = __(
    'This view failed to update automatically, data may be out of date. Check your network connection if the problem persists.'
  )

  useEffect(function () {
    if (model === null) {
      handleQuery({ accountId, range, resolution, now }, authenticatedUser)
    }
  }, [model])

  useEffect(function fetchDataAndScheduleRefresh () {
    if (!focus) {
      return null
    }
    if (model !== null) {
      handleQuery({ accountId, range, resolution, now }, authenticatedUser)
    }

    const tick = window.setInterval(() => {
      handleQuery({ accountId, range, resolution, now }, authenticatedUser, softFailure, true)
    }, 15000)
    return function cancelAutoRefresh () {
      window.clearInterval(tick)
    }
  }, [accountId, range, resolution, focus])

  useEffect(function detectFocusChange () {
    function focus () {
      setFocus(true)
    }
    function blur () {
      setFocus(false)
    }
    window.addEventListener('focus', focus)
    window.addEventListener('blur', blur)
    return function unbind () {
      window.removeEventListener('focus', focus)
      window.removeEventListener('blur', blur)
    }
  })

  if (!model) {
    return (
      <HighlightBox>
        {__('Fetching and aggregating the latest data')}
        <Dots />
      </HighlightBox>
    )
  }

  return (
    <Fragment>
      {stale ? <LoadingOverlay /> : null}
      <Header
        isOperator
        accountName={authenticatedUser ? model.account.name : null}
      />
      <div class='flex flex-column flex-row-l mt4'>
        <div class='w-30-l w-100 flex br0 br2-l mr2-l mb2'>
          <AccountPicker
            accounts={authenticatedUser.accounts}
            selectedId={accountId}
            range={range}
            resolution={resolution}
          />
        </div>
        {!model.empty
          ? (
            <div class='w-70-l w-100 flex bt ba-ns br0 br2-ns mb2-ns b--black-10'>
              <Live model={model} />
            </div>
          )
          : (
            <div class='w-70-l w-100 flex br0 br2-ns mb2'>
              <EmbedCode model={model} onCopy={handleCopy} />
            </div>
          )}
      </div>
      <div class='flex flex-column flex-row-l'>
        <div class='w-100 flex bt ba-ns b--black-10 br0 br2-ns mb2-ns'>
          <RangeSelector
            resolution={resolution}
            range={range}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-ns'>
        <div class='w-100 w-70-m w-75-l flex bt ba-ns b--black-10 br0 br2-ns mb2-ns mr2-ns'>
          <Chart
            isOperator
            model={model}
            resolution={resolution}
          />
        </div>
        <div class='w-100 w-30-m w-25-l flex bt ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <Metrics
            isOperator
            model={model}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-l'>
        <div class='w-100 flex bt ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <URLTables model={model} />
        </div>
      </div>
      <div class='flex flex-column flex-row-l mb2'>
        <div class='w-100 flex bt bb ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <RetentionChart model={model} />
        </div>
      </div>
      {!model.empty
        ? (
          <div class='flex flex-column flex-row-l'>
            <div class='w-100 flex br0 br2-ns mb2'>
              <EmbedCode
                key={`embed-${accountId}`}
                model={model}
                onCopy={handleCopy}
                collapsible
              />
            </div>
          </div>
        )
        : null}
      {adminLevel === ADMIN_LEVEL_ALLOW_EDIT
        ? (
          <div class='flex flex-column flex-row-l'>
            <div class='w-100 flex br0 br2-ns mb2'>
              <Share
                key={`share-${accountId}`}
                onValidationError={handleValidationError}
                onShare={handleShare}
                accountName={model.account.name}
                accountId={accountId}
              />
            </div>
          </div>
        )
        : null}
      {adminLevel === ADMIN_LEVEL_ALLOW_EDIT
        ? (
          <div class='flex flex-column flex-row-l'>
            <div class='w-100 flex br0 br2-ns mb2'>
              <RetireAccount
                key={`retire-${accountId}`}
                account={model.account}
                onRetire={handleRetire}
              />
            </div>
          </div>
        )
        : null}
      <div class='flex flex-column flex-row-l'>
        <div class='w-100 flex br0 br2-ns mb2'>
          <DatabaseSettings
            onPurge={handlePurgeAggregates}
            accountId={accountId}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-l'>
        <div class='w-100 flex br0 br2-ns'>
          <GoSettings />
        </div>
      </div>
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  authenticatedUser: state.authenticatedUser,
  model: state.model,
  stale: state.stale
})

const mapDispatchToProps = {
  handleQuery: model.query,
  handleValidationError: errors.formValidation,
  handleShare: management.shareAccount,
  handleRetire: management.retireAccount,
  handleCopy: management.handleCopy,
  handlePurgeAggregates: database.purgeAggregates
}

const ConnectedAuditoriumView = connect(mapStateToProps, mapDispatchToProps)(AuditoriumView)

module.exports = withLayout()(withAuth('/login/')(withTitle(__('Auditorium | Offen'))(ConnectedAuditoriumView)))
