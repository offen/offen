/** @jsx h */
const { h } = require('preact')
const { connect } = require('react-redux')

const Loading = require('./../shared/loading')
const authentication = require('./../../../action-creators/authentication')

const withAuth = (redirectTo) => (OriginalComponent) => {
  const WrappedComponent = (props) => {
    if (!props.authenticatedUser) {
      props.login(
        null, null,
        __('Please log in using your credentials.')
      )
      return (
        <Loading>
          {__('Checking authentication...')}
        </Loading>
      )
    }
    return <OriginalComponent {...props} />
  }

  const mapStateToProps = (state) => ({
    authenticatedUser: state.authenticatedUser
  })

  const mapDispatchToProps = {
    login: authentication.login
  }

  return connect(mapStateToProps, mapDispatchToProps)(WrappedComponent)
}

module.exports = withAuth
