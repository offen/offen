/** @jsx h */
const { h, Fragment } = require('preact')
const { useEffect } = require('preact/hooks')
const { connect } = require('react-redux')

const Loading = require('./components/shared/loading')
const ConsentStatus = require('./components/index/consent-status')
const HeaderCard = require('./components/index/header-card')
const MainCard = require('./components/index/main-card')
const withTitle = require('./components/hoc/with-title')
const consent = require('./../action-creators/consent-status')

const IndexView = (props) => {
  useEffect(() => {
    props.getStatus()
  }, [])

  if (!props.consentStatus) {
    return (
      <Loading>
        {__('Checking your consent status ...')}
      </Loading>
    )
  }

  const allowsCookies = props.consentStatus && props.consentStatus.allowsCookies
  const consentStatus = props.consentStatus && props.consentStatus.status

  return (
    <Fragment>
      <ConsentStatus
        allowsCookies={allowsCookies}
        consentStatus={consentStatus}
      />
      <HeaderCard
        allowsCookies={allowsCookies}
        consentStatus={consentStatus}
        expressConsent={props.expressConsent}
      />
      <MainCard
        consentStatus={consentStatus}
      />
    </Fragment>
  )
}

const mapDispatchToProps = {
  getStatus: consent.get,
  expressConsent: consent.express
}

const mapStateToProps = (state) => ({
  consentStatus: state.consentStatus
})

module.exports = connect(mapStateToProps, mapDispatchToProps)(withTitle('Offen')(IndexView))
