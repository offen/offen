/** @jsx h */
const { render, h } = require('preact')
const { useRef } = require('preact/hooks')
const Router = require('preact-router')
const { createStore, applyMiddleware, combineReducers } = require('redux')
const { Provider } = require('react-redux')
const thunk = require('redux-thunk').default
const vault = require('offen/vault')

const Layout = require('./src/views/components/shared/layout')
const IndexView = require('./src/views/index')
const LoginView = require('./src/views/login')
const Auditorium = require('./src/views/auditorium')
const ConsoleView = require('./src/views/console')
const NotFoundView = require('./src/views/404')
const JoinView = require('./src/views/join')
const ForgotPasswordView = require('./src/views/forgot-password')
const ResetPasswordView = require('./src/views/reset-password')
const consentStatusReducer = require('./src/reducers/consent-status')
const globalErrorReducer = require('./src/reducers/global-error')
const authenticatedUserReducer = require('./src/reducers/authenticated-user')
const flashReducer = require('./src/reducers/flash')
const staleReducer = require('./src/reducers/stale')
const modelReducer = require('./src/reducers/model')
const redirectMiddleware = require('./src/middleware/redirect')
const navigation = require('./src/action-creators/navigation')

const vaultInstance = vault(process.env.VAULT_HOST || '/vault/')

const middlewares = [
  thunk.withExtraArgument(
    msg => vaultInstance.then(postMessage => postMessage(msg))
  ),
  redirectMiddleware
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
    stale: staleReducer
  }),
  applyMiddleware(
    ...middlewares
  )
)

const App = () => {
  const previousPath = useRef(null)
  const handleRouteChange = (e) => {
    if (previousPath.current !== e.current.props.path) {
      store.dispatch(navigation.navigate(e))
      window.scrollTo(0, 0)
    }
    previousPath.current = e.current.props.path
  }

  return (
    <Provider store={store}>
      <Layout>
        <Router onChange={handleRouteChange}>
          <IndexView path='/' />
          <LoginView path='/login/' />
          <Auditorium.UserView path='/auditorium/' />
          <Auditorium.OperatorView path='/auditorium/:accountId' isOperator />
          <ConsoleView path='/console/' />
          <ForgotPasswordView path='/forgot-password/' />
          <ResetPasswordView path='/reset-password/:token' />
          <JoinView path='/join/new/:token' />
          <JoinView path='/join/addition/:token' isAddition />
          <NotFoundView default />
        </Router>
      </Layout>
    </Provider>
  )
}

render(<App />, document.querySelector('#app-host'))
