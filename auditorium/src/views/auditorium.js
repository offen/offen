/** @jsx h */
const { h, Fragment } = require('preact')
const { useEffect } = require('preact/hooks')
const { connect } = require('react-redux')

const withAuth = require('./components/hoc/with-auth')
const withTitle = require('./components/hoc/with-title')
const Loading = require('./components/shared/loading')
const Header = require('./components/auditorium/header')
const RowRangeManage = require('./components/auditorium/row-range-manage')
const RangeSelector = require('./components/auditorium/range-selector')
const RowMetrics = require('./components/auditorium/row-metrics')
const Privacy = require('./components/auditorium/privacy')
const RetentionChart = require('./components/auditorium/retention-chart')
const URLTables = require('./components/auditorium/url-tables')
const EmbedCode = require('./components/auditorium/embed-code')
const Invite = require('./components/auditorium/invite')
const GoSettings = require('./components/auditorium/go-settings')
const model = require('./../action-creators/model')
const consent = require('./../action-creators/consent-status')
const errors = require('./../action-creators/errors')
const management = require('./../action-creators/management')

const AuditoriumView = (props) => {
  const { matches, authenticatedUser, model, isOperator, consentStatus } = props
  const { handlePurge, handleQuery, expressConsent, getConsentStatus, handleInvite, handleValidationError } = props
  const { accountId, range, resolution } = matches

  useEffect(function fetchData () {
    handleQuery({ accountId, range, resolution }, authenticatedUser)
  }, [accountId, range, resolution])

  if (isOperator) {
    const softFailure = __(
      'This view failed to update automatically, data may be out of date. Check your network connection if the problem persists.'
    )
    useEffect(function scheduleAutoRefresh () {
      const tick = window.setInterval(() => {
        handleQuery({ accountId, range, resolution }, authenticatedUser, softFailure)
      }, 15000)
      return function cancelAutoRefresh () {
        window.clearInterval(tick)
      }
    }, [accountId, range, resolution])
  } else {
    useEffect(function fetchConsentStatus () {
      getConsentStatus()
    }, [])
  }

  if (!model) {
    return (
      <Loading>
        {__('Fetching and decrypting the latest data...')}
      </Loading>
    )
  }

  if (!isOperator && !consentStatus) {
    return (
      <Loading>
        {__('Checking your consent status ...')}
      </Loading>
    )
  }

  return (
    <Fragment>
      <Header
        isOperator={isOperator}
        accountName={(isOperator && authenticatedUser) ? model.result.account.name : null}
      />
      {isOperator
        ? (
          <RowRangeManage
            authenticatedUser={authenticatedUser}
            accountId={accountId}
            model={model}
          />
        )
        : (
          <Privacy
            userHasOptedIn={consentStatus && consentStatus.status === 'allow'}
            onPurge={handlePurge}
            onConsent={expressConsent}
          />
        )}
      <RangeSelector
        matches={matches}
      />
      <RowMetrics
        isOperator={isOperator}
        model={model}
        resolution={resolution}
      />
      <URLTables model={model} />
      <RetentionChart model={model} />
      {isOperator
        ? (
          <EmbedCode
            model={model}
          />
        )
        : null}
      {isOperator
        ? (
          <Invite
            model={model}
            onInvite={handleInvite}
            onValidationError={handleValidationError}
          />
        )
        : null}
      {isOperator
        ? <GoSettings />
        : null}
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  consentStatus: state.consentStatus,
  authenticatedUser: state.authenticatedUser,
  model: state.model
})

const mapDispatchToProps = {
  handleQuery: model.query,
  handlePurge: model.purge,
  getConsentStatus: consent.get,
  expressConsent: consent.express,
  handleValidationError: errors.formValidation,
  handleInvite: management.inviteUser
}

const ConnectedAuditoriumView = connect(mapStateToProps, mapDispatchToProps)(AuditoriumView)

exports.UserView = withTitle(__('Auditorium | Offen'))(ConnectedAuditoriumView)
exports.OperatorView = withAuth('/login/')(withTitle(__('Auditorium | Offen'))(ConnectedAuditoriumView))
