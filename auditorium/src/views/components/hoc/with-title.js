/** @jsx h */
const { h } = require('preact')
const { useEffect } = require('preact/hooks')

const withTitle = (title) => (OriginalComponent) => {
  const WrappedComponent = (props) => {
    useEffect(() => {
      document.title = title
    }, [])
    return <OriginalComponent {...props} />
  }
  return WrappedComponent
}

module.exports = withTitle
