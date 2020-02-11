/** @jsx h */
const { h } = require('preact')

const EmbedCode = (props) => {
  const { model } = props
  return (
    <div class='flex flex-column flex-row-ns mt2'>
      <div class='w-100 br0 br2-ns pa3 mb2 bg-black-05'>
        <div class='flex flex-wrap justify-between'>
          <h4 class='f4 normal mt0 mb3'>{__('Embed code')}</h4>
          <a role='button' class='dib label-toggle label-toggle--rotate' />
        </div>
        <div class='mw6 center mb4'>
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
          <button class='pointer w-100 w-auto-ns f5 tc link dim bn dib br1 ph3 pv2 mt3 white bg-mid-gray'>
            {__('Copy code')}
          </button>
        </div>
      </div>
    </div>
  )
}

module.exports = EmbedCode
