/** @jsx h */
const { h } = require('preact')

const Tables = require('./tables')

const URLTable = (props) => {
  const { model } = props
  return (
    <div class='w-100 bt ba-ns br0 br2-ns b--black-10 pa3 mb2-ns bg-white'>
      <h4 class='f4 normal mt0 mb4'>
        {__('Top pages')}
      </h4>
      <Tables.Container>
        <Tables.Table
          columnNames={[__('URL'), __('Pageviews')]}
          rows={model.result.pages}
        />
      </Tables.Container>
      <Tables.Container>
        <Tables.Table
          headline={__('Referrers')}
          columnNames={[__('Host'), __('Pageviews')]}
          rows={model.result.referrers}
        />
        <Tables.Table
          headline={__('Campaigns')}
          columnNames={[__('Campaign'), __('Pageviews')]}
          rows={model.result.campaigns}
        />
        <Tables.Table
          headline={__('Sources')}
          columnNames={[__('Source'), __('Pageviews')]}
          rows={model.result.sources}
        />
      </Tables.Container>
      <Tables.Container>
        <Tables.Table
          headline={__('Landing Pages')}
          columnNames={[__('URL'), __('Landings')]}
          rows={model.result.landingPages}
        />
        <Tables.Table
          headline={__('Exit Pages')}
          columnNames={[__('URL'), __('Exits')]}
          rows={model.result.exitPages}
        />
      </Tables.Container>
    </div>
  )
}

module.exports = URLTable
