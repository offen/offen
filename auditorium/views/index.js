var html = require('choo/html')
var raw = require('choo/html/raw')

module.exports = function () {
  return html`
    <div class="flex flex-column flex-row-ns items-center w-100 ph3 ph4-ns pv4 mt4 mb2 ba b--black-10 br2 bg-white">
      <div class="w-100 w-70-ns mr3-ns">
        <h3 class="f5 b tc tl-ns mt0 mb0">
          ${__('View and manage the usage data this website has collected from you.')}
        </h3>
      </div>
      <div class="w-100 w-30-ns tc mt2 mt0-ns">
        <a href="/auditorium/" class="f5 tc link dim bn ph3 pv2 dib br1 white bg-dark-green">
          ${__('Open Auditorium')}
        </a>
      </div>
    </div>
    <div class="w-100 ph3 ph4-ns pv4 mb2 br2 bg-black-05">
      <div class="flex justify-center justify-start-ns">
        <a href="https://www.offen.dev/" class="dim mb4" target="_blank">
          <img src="offen-logo-green.svg" alt="offen logo" width="128" height="80">
        </a>
      </div>
      <div class="w-100 w-70-ns">
        <p class="mt0 mb1">
          ${__('Offen is a free and open source analytics software for websites that allows respectful handling of data. It is installed on the website that linked you here.')}
        </p>
        <p class="mt0 mb5">
          ${__('Below you will find answers to the most common questions website users have.')}
        </p>
      </div>
      <div class="flex flex-column flex-row-ns w-100">
        <div class="w-100 w-50-ns mr2-ns">
          <p class="b mt0 mb1">
            ${__('How can I review and delete my usage data?')}
          </p>
          <p class="mt0 mb4">
            ${raw(__('Go to the <a href="%s" class="%s">Auditorium.</a>', '/auditorium/', 'link dim dark-green'))}
          </p>
          <p class="b mt0 mb1">
            ${__('What data is collected?')}
          </p>
          <p class="mt0 mb4">
            ${__('Only page views, sessions, referrer and visited URL are collected. From this, other metrics such as the bounce rate are calculated.')}
          </p>
          <p class="b mt0 mb1">
            ${__("What data isn't collected?")}
          </p>
          <p class="mt0 mb4">
            ${__('Location data, device information and engagement are not collected. There are also no fingerprinting technologies in use.')}
          </p>
          <p class="b mt0 mb1">
            ${__('How is my data handled?')}
          </p>
          <p class="mt0 mb4">
            ${__('Your data is encrypted end-to-end. It will be deleted after 6 months at the latest. Offen does not share your data with third-parties.')}
          </p>
        </div>
        <div class="w-100 w-50-ns ml4-ns">
          <p class="b mt0 mb1">
            ${__('Why do I need to opt in or opt out?')}
          </p>
          <p class="mt0 mb4">
            ${__('Our banner serves two purposes: We ask you to access your usage data and would like to obtain your consent for its use.')}
          </p>
          <p class="b mt0 mb1">
            ${__('Do you use cookies?')}
          </p>
          <p class="mt0 mb4">
            ${__('Yes, in particular cookies are used to store your decision about granting access to your usage data. If you opt in, we also use cookies to store a user and a session ID for you.')}
          </p>
          <p class="b mt0 mb1">
            ${__('How does it all work?')}
          </p>
          <p class="mt0 mb1">
            ${__('After opening a website that has offen installed you can explicitly opt in to the data collection and thereby help to improve the services you use.')}
          </p>
          <p class="mt0 mb1">
            ${raw(__('Only then you will be assigned a user and a session ID using a cookie. Learn more about cookies <a href="https://en.wikipedia.org/wiki/HTTP_cookie" class="%s" target="_blank">here.</a>', 'link dim dark-green'))}
          </p>
          <p class="mt0 mb4">
            ${__('Offen handles these IDs in an unrecognizable form. Operators can identify you only within one website.')}
          </p>
          <p class="mt0 mb3">
            ${raw(__('Visit <a href="%s" class="%s" target="_blank">www.offen.dev</a> for more information.', 'https://www.offen.dev/', 'link dim dark-green'))}
          </p>
        </div>
      </div>
    </div>
    <div class="flex flex-column flex-row-ns items-center w-100 ph3 ph4-ns pv4 br2 bg-black-05">
      <div class="w-100 w-70-ns mr3-ns">
        <h3 class="f5 tc tl-ns normal mt0 mb0">
          ${__('Are you the operator of this Offen installation? Log in to your account.')}
        </h3>
      </div>
      <div class="w-100 w-30-ns tc mt2 mt0-ns">
        <a href="/login/" class="f5 tc link dim bn ph3 pv2 dib br1 white bg-mid-gray">
          ${__('Log in as operator')}
        </a>
      </div>
    </div>
  `
}
