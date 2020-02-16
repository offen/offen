/** @jsx h */
const { h } = require('preact')

const Chart = require('./chart')
const KeyMetric = require('./key-metric')

const RowMetrics = (props) => {
  const { isOperator, model, resolution } = props

  const uniqueEntities = isOperator
    ? model.result.uniqueUsers
    : model.result.uniqueAccounts
  const entityName = isOperator
    ? __('users')
    : __('accounts')

  return (
    <div class='flex flex-column flex-row-ns'>
      <div class='flex flex-column w-100 w-70-m w-75-l bt ba-ns b--black-10 br0 br2-ns pa3 mb2-ns mr2-ns bg-white '>
        <h4 class='f4 normal mt0 mb3'>
          {__('Page views and %s', isOperator ? __('visitors') : __('accounts'))}
        </h4>
        <Chart
          pageviews={model.result.pageviews}
          isOperator={isOperator}
          resolution={resolution}
        />
      </div>
      <div class='w-100 w-30-m w-25-l bt ba-ns br0 br2-ns b--black-10 pa3 mb2-ns bg-white'>
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
              value={model.result.uniqueSessions}
              formatAs='count'
            />
          </div>
          <div class='w-100 mb3 bb b--light-gray'>
            {model.result.avgPageDepth
              ? (
                <KeyMetric
                  name={__('Avg. page depth')}
                  value={model.result.avgPageDepth}
                  formatAs='number'
                  small
                />
              )
              : null}
            <KeyMetric
              name={__('Bounce rate')}
              value={model.result.bounceRate}
              formatAs='percentage'
              small
            />
            {isOperator && model.result.loss
              ? (
                <KeyMetric
                  name={__('Plus')}
                  value={model.result.avgPageDepth}
                  formatAs='percentage'
                  small
                />
              )
              : null}
          </div>
          <div>
            <KeyMetric
              name={__('Mobile users')}
              value={model.result.mobileShare}
              formatAs='percentage'
              small
            />
            {model.result.avgPageload
              ? (
                <KeyMetric
                  name={__('Avg. page load time')}
                  value={model.result.avgPageload}
                  formatAs='duration'
                  small
                />
              )
              : null}
          </div>
        </div>
      </div>
    </div>
  )
}

module.exports = RowMetrics
