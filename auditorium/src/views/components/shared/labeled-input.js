/** @jsx h */
const { h } = require('preact')

const LabeledInput = (props) => {
  const { labelClass = 'lh-copy', children, ...otherProps } = props
  return (
    <label class={labelClass}>
      {children}
      <input
        class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
        {...otherProps}
      />
    </label>
  )
}

module.exports = LabeledInput
