/** @jsx h */
const { h, Fragment } = require('preact')
const { useEffect, useState } = require('preact/hooks')
const { connect } = require('react-redux')

const withAuth = require('./components/_shared/with-auth')
const withTitle = require('./components/_shared/with-title')
const withLayout = require('./components/_shared/with-layout')
const HighlightBox = require('./components/_shared/highlight-box')
const Header = require('./components/auditorium/header')
const RangeSelector = require('./components/auditorium/range-selector')
const Metrics = require('./components/auditorium/metrics')
const Chart = require('./components/auditorium/chart')
const Privacy = require('./components/auditorium/privacy')
const RetentionChart = require('./components/auditorium/retention-chart')
const URLTables = require('./components/auditorium/url-tables')
const EmbedCode = require('./components/auditorium/embed-code')
const Share = require('./components/auditorium/share')
const GoSettings = require('./components/auditorium/go-settings')
const LoadingOverlay = require('./components/auditorium/loading-overlay')
const AccountPicker = require('./components/auditorium/account-picker')
const RetireAccount = require('./components/auditorium/retire-account')
const Live = require('./components/auditorium/live')
const model = require('./../action-creators/model')
const consent = require('./../action-creators/consent-status')
const errors = require('./../action-creators/errors')
const management = require('./../action-creators/management')

const AuditoriumView = (props) => {
  const { matches, authenticatedUser, model, isOperator, consentStatus, stale } = props
  const { handlePurge, handleQuery, expressConsent, getConsentStatus, handleInvite, handleValidationError, handleRetire } = props
  const { accountId, range, resolution } = matches
  const [focus, setFocus] = useState(true)

  useEffect(function fetchData () {
    handleQuery({ accountId, range, resolution }, authenticatedUser)
  }, [accountId, range, resolution, focus])

  if (isOperator) {
    const softFailure = __(
      'This view failed to update automatically, data may be out of date. Check your network connection if the problem persists.'
    )
    useEffect(function scheduleAutoRefresh () {
      if (!focus) {
        return null
      }
      const tick = window.setInterval(() => {
        handleQuery({ accountId, range, resolution }, authenticatedUser, softFailure, true)
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
  } else {
    useEffect(function fetchConsentStatus () {
      getConsentStatus()
    }, [])
  }

  if (!model) {
    return (
      <HighlightBox>
        {__('Fetching and decrypting the latest data...')}
      </HighlightBox>
    )
  }

  if (!isOperator && !consentStatus) {
    return (
      <HighlightBox>
        {__('Checking your consent status ...')}
      </HighlightBox>
    )
  }

  return (
    <Fragment>
      {stale ? <LoadingOverlay /> : null}
      <Header
        isOperator={isOperator}
        accountName={(isOperator && authenticatedUser) ? model.account.name : null}
      />
      <div class='flex flex-column flex-row-l mt4'>
        {isOperator
          ? (
            <Fragment>
              <div class='w-30-l w-100 flex br0 br2-l mr2-l mb2'>
                <AccountPicker
                  accounts={authenticatedUser.accounts}
                  selectedId={accountId}
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
                    <EmbedCode model={model} expand />
                  </div>
                )}
            </Fragment>
          )
          : (
            <div class='w-100 flex mb2 mr0-ns br0 br2-ns'>
              <Privacy
                userHasOptedIn={consentStatus && consentStatus.status === 'allow'}
                onPurge={handlePurge}
                onConsent={expressConsent}
              />
            </div>
          )}
      </div>
      <div class='flex flex-column flex-row-l'>
        <div class='w-100 flex bt ba-ns b--black-10 br0 br2-ns mb2-ns'>
          <RangeSelector
            matches={matches}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-ns'>
        <div class='w-100 w-70-m w-75-l flex bt ba-ns b--black-10 br0 br2-ns mb2-ns mr2-ns'>
          <Chart
            model={model}
            isOperator={isOperator}
            resolution={resolution}
          />
        </div>
        <div class='w-100 w-30-m w-25-l flex bt ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <Metrics
            isOperator={isOperator}
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
      {isOperator
        ? (
          <Fragment>
            {!model.empty
              ? (
                <div class='flex flex-column flex-row-l'>
                  <div class='w-100 flex br0 br2-ns mb2'>
                    <EmbedCode
                      model={model}
                      collapsible
                    />
                  </div>
                </div>
              )
              : null}
            <div class='flex flex-column flex-row-l'>
              <div class='w-100 flex br0 br2-ns mb2'>
                <Share
                  onValidationError={handleValidationError}
                  onShare={handleInvite}
                  accountName={model.account.name}
                  accountId={accountId}
                />
              </div>
            </div>
            <div class='flex flex-column flex-row-l'>
              <div class='w-100 flex br0 br2-ns mb2'>
                <RetireAccount
                  account={model.account}
                  onRetire={handleRetire}
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
        : null}
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  consentStatus: state.consentStatus,
  authenticatedUser: state.authenticatedUser,
  model: state.model,
  stale: state.stale
})

const mapDispatchToProps = {
  handleQuery: model.query,
  handlePurge: model.purge,
  getConsentStatus: consent.get,
  expressConsent: consent.express,
  handleValidationError: errors.formValidation,
  handleInvite: management.inviteUser,
  handleRetire: management.retireAccount
}

const ConnectedAuditoriumView = connect(mapStateToProps, mapDispatchToProps)(AuditoriumView)

exports.UserView = withLayout()(withTitle(__('Auditorium | Offen'))(ConnectedAuditoriumView))
exports.OperatorView = withLayout()(withAuth('/login/')(withTitle(__('Auditorium | Offen'))(ConnectedAuditoriumView)))
