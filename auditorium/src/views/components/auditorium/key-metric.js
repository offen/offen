/** @jsx h */
const { h } = require('preact')
const classnames = require('classnames')

const Format = require('./format')

const KeyMetric = (props) => {
  const { value, name, small, formatAs } = props
  return (
    <div class='w-100 mb4'>
      <p class={classnames('mv0', { f2: !small }, { f3: small })}>
        <Format formatAs={formatAs}>
          {value}
        </Format>
      </p>
      <p class='mv0 normal'>
        {name}
      </p>
    </div>
  )
}

module.exports = KeyMetric
