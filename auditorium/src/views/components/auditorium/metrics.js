/** @jsx h */
const { h } = require('preact')

const KeyMetric = require('./key-metric')

const RowMetrics = (props) => {
  const { isOperator, model } = props

  const uniqueEntities = isOperator
    ? model.uniqueUsers
    : model.uniqueAccounts
  const entityName = isOperator
    ? __('users')
    : __('accounts')

  return (
    <div class='pa3 bg-white flex-auto'>
      <h4 class='f4 normal mt0 mb3'>
        {__('Key metrics')}
      </h4>
      <div class='flex flex-wrap'>
        <div class='w-100 mb3 bb b--light-gray'>
          <KeyMetric
            name={__('Unique %s', entityName)}
            value={uniqueEntities}
            formatAs='count'
          />
          <KeyMetric
            name={__('Unique sessions')}
            value={model.uniqueSessions}
            formatAs='count'
          />
        </div>
        <div class='w-100 mb3 bb b--light-gray'>
          {model.avgPageDepth
            ? (
              <KeyMetric
                name={__('Avg. page depth')}
                value={model.avgPageDepth}
                formatAs='number'
                small
              />
            )
            : null}
          <KeyMetric
            name={__('Bounce rate')}
            value={model.bounceRate}
            formatAs='percentage'
            small
          />
          {isOperator && model.loss
            ? (
              <KeyMetric
                name={__('Plus')}
                value={model.avgPageDepth}
                formatAs='percentage'
                small
              />
            )
            : null}
        </div>
        <div>
          <KeyMetric
            name={__('Mobile users')}
            value={model.mobileShare}
            formatAs='percentage'
            small
          />
          {model.avgPageload
            ? (
              <KeyMetric
                name={__('Avg. page load time')}
                value={model.avgPageload}
                formatAs='duration'
                small
              />
            )
            : null}
        </div>
      </div>
    </div>
  )
}

module.exports = RowMetrics
