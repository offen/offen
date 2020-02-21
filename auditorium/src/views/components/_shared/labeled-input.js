/** @jsx h */
const { h } = require('preact')
const { forwardRef } = require('preact/compat')

const LabeledInput = forwardRef((props, ref) => {
  const { labelClass = 'lh-copy', children, ...otherProps } = props
  return (
    <label class={labelClass}>
      {children}
      <input
        class='w-100 pa2 mb3 input-reset ba b--black-10 bg-white'
        ref={ref}
        {...otherProps}
      />
    </label>
  )
})

module.exports = LabeledInput
