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
const globalErrorReducer = require('./src/reducers/global-error')
const setupStatusReducer = require('./src/reducers/setup-status')
const authenticatedUserReducer = require('./src/reducers/authenticated-user')
const flashReducer = require('./src/reducers/flash')
const staleReducer = require('./src/reducers/stale')
const modelReducer = require('./src/reducers/model')
const redirectMiddleware = require('./src/middleware/redirect')
const flashMessagesMiddleware = require('./src/middleware/flash-messages')
const navigation = require('./src/action-creators/navigation')
const errors = require('./src/action-creators/errors')

sf('./styles/word-break.css')
sf('./styles/dim-fix.css')
sf('./styles/grow-list.css')
sf('./styles/label-toggle.css')
sf('./styles/negative-margins.css')

const vaultInstance = vault(process.env.VAULT_HOST || '/vault/')

const middlewares = [
  thunk.withExtraArgument(
    msg => vaultInstance.then(postMessage => postMessage(msg))
  ),
  redirectMiddleware,
  flashMessagesMiddleware
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
    setupStatus: setupStatusReducer
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
