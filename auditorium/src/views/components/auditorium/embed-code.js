/** @jsx h */
const { h } = require('preact')
const { CopyToClipboard } = require('react-copy-to-clipboard')
const classnames = require('classnames')

const Collapsible = require('./../shared/collapsible')

const EmbedCode = (props) => {
  const { model } = props
  return (
    <div class='flex flex-column flex-row-ns mt2'>
      <div class='w-100 br0 br2-ns pa3 mb2 bg-black-05'>
        <Collapsible
          headline={(props) => {
            const { isCollapsed } = props
            return (
              <div class='flex flex-wrap justify-between pointer'>
                <h4 class='f4 normal ma0'>{__('Embed code')}</h4>
                <a role='button' class={classnames('dib', 'label-toggle', isCollapsed ? null : 'label-toggle--rotate')} />
              </div>
            )
          }}
          body={(props) => {
            return (
              <div class='mw6 center mb4 mt3'>
                <p
                  class='ma0 mb3'
                  dangerouslySetInnerHTML={{
                    __html: __('To use Offen with the account <strong>%s</strong> on your website, embed the following script on each page you want to appear in your statistics.', model.result.account.name)
                  }}
                />
                <div class='w-100 br1 ba b--moon-gray ph2 pv2 bg-light-yellow'>
                  <code
                    class='ma0 lh-solid word-wrap'
                    dangerouslySetInnerHTML={{
                      __html: `&lt;script async src="${window.location.origin}/script.js" data-account-id="${model.result.account.accountId}"&gt;&lt;/script&gt;`
                    }}
                  />
                </div>
                <CopyToClipboard
                  text={
                    `<script async src="${window.location.origin}/script.js" data-account-id="${model.result.account.accountId}"></script>`
                  }
                >
                  <button class='pointer w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mt3 white bg-mid-gray'>
                    {__('Copy code')}
                  </button>
                </CopyToClipboard>
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}

module.exports = EmbedCode
