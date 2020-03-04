/** @jsx h */
const { h } = require('preact')

const HighlightBox = require('./../_shared/highlight-box')

module.exports = (props) => {
  if (props.consentStatus) {
    const text = props.consentStatus === 'allow'
      ? __('You are <strong>opted in</strong>.')
      : __('You are <strong>opted out</strong>.')
    return (
      <HighlightBox
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  } else if (!props.allowsCookies) {
    return (
      <HighlightBox
        dangerouslySetInnerHTML={{
          __html: __('It seems like your browser is <strong>blocking cookies.</strong>')
        }}
      />
    )
  }
  return null
}
