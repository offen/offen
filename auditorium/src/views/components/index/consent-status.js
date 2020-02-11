/** @jsx h */
const { h } = require('preact')

module.exports = (props) => {
  if (props.consentStatus) {
    const text = props.consentStatus === 'allow'
      ? __('You are <strong>opted in</strong>.')
      : __('You are <strong>opted out</strong>.')
    return (
      <p
        dangerouslySetInnerHTML={{ __html: text }}
        class='dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow'
      />
    )
  } else if (!props.allowsCookies) {
    return (
      <p
        dangerouslySetInnerHTML={{ __html: __('It seems like your browser is <strong>blocking cookies.</strong>') }}
        class='dib pa2 br2 ma0 mt3 ml3 ml0-ns mr3 mr0-ns bg-light-yellow'
      />
    )
  }
  return null
}
