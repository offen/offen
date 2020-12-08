/**
 * Copyright 2020 - Offen Authors <hioffen@posteo.de>
 * SPDX-License-Identifier: Apache-2.0
 */

/** @jsx h */
const { h, Fragment } = require('preact')
const classnames = require('classnames')

const Slides = require('./slides')

const UserOnboarding = (props) => {
  const { onComplete } = props
  return (
    <Fragment>
      <div class='flex flex-column flex-row-l mt4-m mt4-l'>
        <div class='w-100 flex bt bb ba-ns b--black-10 br0 br2-ns mb2-ns'>
          <div class='pa3 pa4-m pa5-l bg-white w-100'>


            <div class='cf mb0 mb4-m mb5-l'>
              <a
                class='fr f5 b normal link dim dib dark-green pointer'
                role='button'
                onclick={onComplete}
              >
                {__('Skip')}
              </a>
            </div>


            <div class=''>
              <Slides
                slides={[
                  (props) => {
                    const { onNext } = props
                    return (
                      <Fragment>
                        <div class='flex flex-column flex-row-ns items-start justify-center-ns onboarding-height'>
                          <div class='w-100 w-25-ns mr0 mr4-m mr5-l'>
                            <img src='/offen-onboarding-1.svg' alt='Onboarding illustration 1' width='180' height='190' class='onboarding-image-height db center' />
                          </div>
                          <div class='w-100 w-75-ns mt3 mt0-ns'>
                            <div class='w-100 w-80-l lh-copy mt2-m mt3-l'>
                              <p class='ma0 mb3'>
                                {__('Welcome to the Auditorium, this is how it works.')}
                              </p>
                              <p class='f3 ma0 mb3'>
                                {__('What coolblog.com knows about you.')}
                              </p>
                              <p class='ma0'>
                                {__('You just visited the page coolblog.com/nice-article. It is probably your first time on coolblog.com. You came by a link on GitHub. Most likely your are on a deskop device.')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div class='flex justify-center mb4'>
                          <button onclick={onNext} class='w-100 w-20-ns f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green pointer'>
                            {__('Next')}
                          </button>
                        </div>
                      </Fragment>
                    )
                  },
                  (props) => {
                    const { onNext } = props
                    return (
                      <Fragment>
                        <div class='flex flex-column flex-row-ns items-start justify-center-ns onboarding-height'>
                          <div class='w-100 w-25-ns mr0 mr4-m mr5-l mt4 mt0-ns'>
                            <img src='/offen-onboarding-2.svg' alt='Onboarding illustration 2' width='180' height='190' class='onboarding-image-height db center' />
                          </div>
                          <div class='w-100 w-75-ns mt3 mt0-ns'>
                            <div class='w-100 w-80-l lh-copy mt3-m mt4-l'>
                              <p class='f3 ma0 mb3'>
                                {__('Your data always stays yours.')}
                              </p>
                              <p class='ma0 mb3'>
                                {__('Review your data in the Auditorium. You can delete your data or opt out completly at any time in the Privacy tab.')}
                              </p>
                              <div class='di v-mid'>
                                <span>
                                  <svg width='19' height='20' viewBox='0 0 19 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
                                    <circle cx='9.5' cy='10.5' r='9.5' fill='#FBF1A9'/>
                                    <path d='M9.75781 15.1562C8.51823 15.1562 7.50781 14.776 6.72656 14.0156C5.95052 13.2552 5.5625 12.2422 5.5625 10.9766V10.7578C5.5625 9.90885 5.72656 9.15104 6.05469 8.48438C6.38281 7.8125 6.84635 7.29688 7.44531 6.9375C8.04948 6.57292 8.73698 6.39062 9.50781 6.39062C10.6641 6.39062 11.5729 6.75521 12.2344 7.48438C12.901 8.21354 13.2344 9.2474 13.2344 10.5859V11.5078H7.85156C7.92448 12.0599 8.14323 12.5026 8.50781 12.8359C8.8776 13.1693 9.34375 13.3359 9.90625 13.3359C10.776 13.3359 11.4557 13.0208 11.9453 12.3906L13.0547 13.6328C12.7161 14.112 12.2578 14.487 11.6797 14.7578C11.1016 15.0234 10.4609 15.1562 9.75781 15.1562ZM9.5 8.21875C9.05208 8.21875 8.6875 8.36979 8.40625 8.67188C8.13021 8.97396 7.95312 9.40625 7.875 9.96875H11.0156V9.78906C11.0052 9.28906 10.8698 8.90365 10.6094 8.63281C10.349 8.35677 9.97917 8.21875 9.5 8.21875Z' fill='#777777' />
                                  </svg>
                                  </span>
                              </div>
                              <p class='di ma0 ml2'>
                                {__('Click this symbol to display detailed explanations of the respective terms.')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div class='flex justify-center mb4'>
                          <button onclick={onNext} class='w-100 w-20-ns f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green pointer'>
                            {__('Next')}
                          </button>
                        </div>
                      </Fragment>
                    )
                  },
                  (props) => {
                    return (
                      <Fragment>
                        <div class='flex flex-column flex-row-ns items-start justify-center-ns onboarding-height'>
                          <div class='w-100 w-25-ns mr0 mr4-m mr5-l mt4 mt0-ns'>
                            <img src='/offen-onboarding-3.svg' alt='Onboarding illustration 3' width='180' height='190' class='onboarding-image-height db center' />
                          </div>
                          <div class='w-100 w-75-ns mt3 mt0-ns'>
                            <div class='w-100 w-80-l lh-copy mt3-m mt4-l'>
                              <p class='f3 ma0 mb3'>
                                {__('Bookmark this page to come back later.')}
                              </p>
                              <p class='ma0 mb1'>
                                {__('Get an overall picture of your data collected over time. Come back here anytime to see what coolblog.com knows about you.')}
                              </p>
                              <p class='ma0'>
                                {__('Now let\'s get started!')}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div class='flex justify-center mb4'>
                          <button onclick={onComplete} class='w-100 w-30-m w-20-l f5 tc dim bn ph3 pv2 dib br1 white bg-dark-green pointer'>
                            {__('Open Auditorium')}
                          </button>
                        </div>
                      </Fragment>
                    )
                  }
                ]}


                navigation={(props) => {
                  const { onChange, activeItem, numItems } = props
                  return (
                    <div class='flex justify-center'>

                      <ul class='flex justify-center list pa0 ma0'>
                        {Array.from({ length: numItems }).map(function (el, index) {
                          return (
                            <li key={`slider-item-${index}`} onclick={() => onChange(index)}>
                              <a class='pointer mh2' role='button'>
                                <svg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'>
                                  {index === activeItem
                                    ? (
                                      <circle cx='4' cy='4' r='4' fill='#555555'></circle>
                                    )
                                    : (
                                      <circle cx='4' cy='4' r='4' fill='#CCCCCC'></circle>
                                    )
                                  }
                                </svg>
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    </div>

                  )
                }}





              />
            </div>



          </div>
        </div>
      </div>
    </Fragment>
  )
}

module.exports = UserOnboarding
