/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { render, h } = require('preact')
const { useRef, useErrorBoundary } = require('preact/hooks')
const Router = require('preact-router')
const { createStore, applyMiddleware, combineReducers } = require('redux')
const { Provider } = require('react-redux')
const thunk = require('redux-thunk').default
const vault = require('offen/vault')
const sf = require('sheetify')

const IndexView = require('./src/views/index')
const LoginView = require('./src/views/login')
const SetupView = require('./src/views/setup')
const AuditoriumUser = require('./src/views/auditorium-user')
const AuditoriumOperator = require('./src/views/auditorium-operator')
const ConsoleView = require('./src/views/console')
const NotFoundView = require('./src/views/404')
const JoinView = require('./src/views/join')
const ForgotPasswordView = require('./src/views/forgot-password')
const ResetPasswordView = require('./src/views/reset-password')
const consentStatusReducer = require('./src/reducers/consent-status')
const queryParamsReducer = require('./src/reducers/query-params')
const globalErrorReducer = require('./src/reducers/global-error')
const setupStatusReducer = require('./src/reducers/setup-status')
const authenticatedUserReducer = require('./src/reducers/authenticated-user')
const flashReducer = require('./src/reducers/flash')
const staleReducer = require('./src/reducers/stale')
const modelReducer = require('./src/reducers/model')
const onboardingCompletedReducer = require('./src/reducers/onboarding-completed')
const redirectMiddleware = require('./src/middleware/redirect')
const pushStateMiddleware = require('./src/middleware/push-state')
const flashMessagesMiddleware = require('./src/middleware/flash-messages')
const queryParamsMiddleware = require('./src/middleware/query-params')
const navigation = require('./src/action-creators/navigation')
const errors = require('./src/action-creators/errors')

sf('./styles/viewports.css')
sf('./styles/onboarding.css')
sf('./styles/word-break.css')
sf('./styles/dim-fix.css')
sf('./styles/grow-list.css')
sf('./styles/label-toggle.css')
sf('./styles/filter-elements.css')
sf('./styles/extra-margins.css')
sf('./styles/loading-overlay.css')
sf('./styles/first-letter-uppercase.css')

const vaultInstances = Promise.resolve([
  vault(process.env.VAULT_HOST || (window.location.origin + '/vault'))
])

const middlewares = [
  thunk.withExtraArgument(
    (msg) => {
      if (msg.meta && msg.meta.queryAll) {
        return vaultInstances.then(instances => {
          return Promise.all(instances.map(instance => {
            return instance.then(postMessage => postMessage(msg))
          }))
        })
      }
      return vaultInstances.then(
        instances => instances[0].then(postMessage => postMessage(msg))
      )
    }
  ),
  pushStateMiddleware,
  redirectMiddleware,
  flashMessagesMiddleware,
  queryParamsMiddleware
]

if (process.env.NODE_ENV !== 'production') {
  const { logger } = require('redux-logger')
  middlewares.push(logger)
}

const store = createStore(
  combineReducers({
    globalError: globalErrorReducer,
    consentStatus: consentStatusReducer,
    authenticatedUser: authenticatedUserReducer,
    flash: flashReducer,
    model: modelReducer,
    stale: staleReducer,
    setupStatus: setupStatusReducer,
    onboardingCompleted: onboardingCompletedReducer,
    queryParams: queryParamsReducer
  }),
  applyMiddleware(
    ...middlewares
  )
)

const App = () => {
  useErrorBoundary((err) => store.dispatch(errors.unrecoverable(err)))
  const previousPath = useRef(null)
  const handleRouteChange = (e) => {
    if (previousPath.current !== e.current.props.path) {
      store.dispatch(navigation.navigate(e.url))
      window.scrollTo(0, 0)
    }
    previousPath.current = e.current.props.path
    if (window.__offen__ && window.__offen__.pageview) {
      window.__offen__.pageview({ skipConsent: true })
    }
  }

  return (
    <Provider store={store}>
      <Router onChange={handleRouteChange}>
        <IndexView path='/' />
        <LoginView path='/login/' />
        <AuditoriumUser path='/auditorium/' />
        <AuditoriumOperator path='/auditorium/:accountId' />
        <ConsoleView path='/console/' />
        <SetupView path='/setup/' />
        <ForgotPasswordView path='/forgot-password/' />
        <ResetPasswordView path='/reset-password/:token' />
        <JoinView path='/join/:token' />
        <NotFoundView default />
      </Router>
    </Provider>
  )
}

render(<App />, document.querySelector('#app-host'))
