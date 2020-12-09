/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const { useEffect } = require('preact/hooks')
const { connect } = require('react-redux')

const withTitle = require('./components/_shared/with-title')
const withLayout = require('./components/_shared/with-layout')
const useExplainer = require('./components/_shared/use-explainer')
const HighlightBox = require('./components/_shared/highlight-box')
const Dots = require('./components/_shared/dots')
const Header = require('./components/auditorium/header')
const ExplainerHeader = require('./components/auditorium/explainer-header')
const RangeSelector = require('./components/auditorium/range-selector')
const Metrics = require('./components/auditorium/metrics')
const Chart = require('./components/auditorium/chart')
const Privacy = require('./components/auditorium/privacy')
const RetentionChart = require('./components/auditorium/retention-chart')
const URLTables = require('./components/auditorium/url-tables')
const UserOnboading = require('./components/auditorium/user-onboarding')
const BasicTerms = require('./components/auditorium/basic-terms')
const FrequentlyAskedQuestions = require('./components/auditorium/frequently-asked-questions')
const model = require('./../action-creators/model')
const consent = require('./../action-creators/consent-status')
const onboarding = require('./../action-creators/onboarding')

const AuditoriumView = (props) => {
  const { matches, model, consentStatus, onboardingCompleted } = props
  const { handlePurge, handleQuery, expressConsent, getConsentStatus, getOnboardingStatus, completeOnboarding } = props
  const { range, resolution, onboarding: forceOnboarding } = matches

  useEffect(function fetchConsentStatus () {
    getConsentStatus()
    getOnboardingStatus()
  }, [])

  if (!consentStatus || onboardingCompleted === null) {
    return (
      <HighlightBox>
        {__('Checking your consent status')}
        <Dots />
      </HighlightBox>
    )
  }

  // it's important to keep this hook below the check for the consent status so
  // that it does not create a race condition between consentStatus and events
  useEffect(function fetchData () {
    handleQuery({ accountId: null, range, resolution }, null)
  }, [range, resolution, consentStatus])

  if (!model) {
    return (
      <HighlightBox>
        {__('Fetching and decrypting the latest data')}
        <Dots />
      </HighlightBox>
    )
  }
  if ((!onboardingCompleted || forceOnboarding) && model.onboardingStats) {
    return (
      <UserOnboading
        onComplete={completeOnboarding}
        stats={model.onboardingStats}
      />
    )
  }

  const explainerPropsFor = useExplainer()

  return (
    <Fragment>
      <Header
        isOperator={false}
        accountName={null}
      />
      <div class='flex flex-column flex-row-l mt4'>
        <div class='w-100 flex mb2 mr0-ns br0 br2-ns'>
          <Privacy
            userHasOptedIn={consentStatus.status === 'allow'}
            onPurge={handlePurge}
            onConsent={expressConsent}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-l'>
        <div class='w-100 flex bt ba-ns b--black-10 br0 br2-ns mb2-ns'>
          <ExplainerHeader />
        </div>
      </div>
      <div class='flex flex-column flex-row-l'>
        <div class='w-100 flex bt ba-ns b--black-10 br0 br2-ns mb2-ns'>
          <RangeSelector
            resolution={resolution}
            range={range}
            {...explainerPropsFor('range-selector')}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-ns'>
        <div class='w-100 flex bt ba-ns b--black-10 br0 br2-ns mb2-ns'>
          <Chart
            model={model}
            isOperator={false}
            resolution={resolution}
            {...explainerPropsFor('chart')}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-ns'>
        <div class='w-100 flex bt ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <Metrics
            arrangement='horizontal'
            isOperator={false}
            model={model}
            {...explainerPropsFor('metrics')}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-l'>
        <div class='w-100 flex bt ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <URLTables
            model={model}
            {...explainerPropsFor('url-tables')}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-l mb2'>
        <div class='w-100 flex bt bb ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <RetentionChart
            model={model}
            {...explainerPropsFor('retention')}
          />
        </div>
      </div>
      <div class='flex flex-column flex-row-l mb2'>
        <div class='w-100 flex bt bb ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <BasicTerms />
        </div>
      </div>
      <div class='flex flex-column flex-row-l mb2'>
        <div class='w-100 flex bt bb ba-ns br0 br2-ns b--black-10 mb2-ns'>
          <FrequentlyAskedQuestions />
        </div>
      </div>
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  consentStatus: state.consentStatus,
  model: state.model,
  onboardingCompleted: state.onboardingCompleted
})

const mapDispatchToProps = {
  handleQuery: model.query,
  handlePurge: model.purge,
  getConsentStatus: consent.get,
  expressConsent: consent.express,
  getOnboardingStatus: onboarding.getStatus,
  completeOnboarding: onboarding.setCompleted
}

const ConnectedAuditoriumView = connect(mapStateToProps, mapDispatchToProps)(AuditoriumView)

module.exports = withLayout()(withTitle(__('Auditorium | Offen'))(ConnectedAuditoriumView))
