/** @jsx h */
const { h, Fragment } = require('preact')
const { useEffect } = require('preact/hooks')
const { connect } = require('react-redux')

const HighlightBox = require('./components/_shared/highlight-box')
const ConsentStatusDisplay = require('./components/index/consent-status-display')
const HeaderCard = require('./components/index/header-card')
const MainCard = require('./components/index/main-card')
const OperatorLogin = require('./components/index/operator-login')
const withTitle = require('./components/_shared/with-title')
const withLayout = require('./components/_shared/with-layout')
const consent = require('./../action-creators/consent-status')

const IndexView = (props) => {
  useEffect(() => {
    props.getStatus()
  }, [])

  if (!props.consentStatus) {
    return (
      <HighlightBox>
        {__('Checking your consent status ...')}
      </HighlightBox>
    )
  }

  const allowsCookies = props.consentStatus && props.consentStatus.allowsCookies
  const consentStatus = props.consentStatus && props.consentStatus.status

  return (
    <Fragment>
      <ConsentStatusDisplay
        allowsCookies={allowsCookies}
        consentStatus={consentStatus}
      />
      <div class='w-100 mt4 mb2 bt bb ba-ns br0 br2-ns b--black-10'>
        <HeaderCard
          allowsCookies={allowsCookies}
          consentStatus={consentStatus}
          expressConsent={props.expressConsent}
        />
      </div>
      <div class='w-100 mb2 br0 br2-ns'>
        <MainCard
          consentStatus={consentStatus}
        />
      </div>
      <div class='w-100 br0 br2-ns'>
        <OperatorLogin />
      </div>
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

module.exports = connect(mapStateToProps, mapDispatchToProps)(
  withLayout()(
    withTitle('Offen')(
      IndexView
    )
  )
)
