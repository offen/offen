/** @jsx h */
const { h } = require('preact')

const SubmitButton = (props) => {
  const { children, ...otherProps } = props
  return (
    <input
      class='pointer w-100 w-auto-ns f5 link dim bn ph3 pv2 mb3 dib br1 white bg-mid-gray'
      type='submit'
      value={props.disabled ? (props.disabledCopy || __('One moment...')) : children}
      {...otherProps}
    />
  )
}

module.exports = SubmitButton
