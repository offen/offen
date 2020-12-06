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
                        <div class='flex flex-column flex-row-ns justify-center h5-l'>
                          <div class='w-100 w-25-ns tc tr-ns mr0 mr4-m mr5-l'>
                            <img src='/offen-onboarding-1.svg' alt='Onboarding illustration 1' width='180' height='190' class='ma0' />
                          </div>
                          <div class='w-100 w-75-ns mt3 mt0-ns mb4 mb5-l'>
                            <div class='w-100 w-80-l lh-copy'>
                              <p class='ma0 mb3'>
                                {__('Welcome to the Auditorium. You opted in for fair web analytics, this is how it works.')}
                              </p>
                              <p class='f3 ma0 mb3'>
                                {__('What coolblog.com knows about you.')}
                              </p>
                              <p class='ma0'>
                                {__('You just have visited the page coolblog.com/nice-article. It is probably your first time on coolblog.com. You came here by a link on GitHub. Most likely your are on a deskop device.')}
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
                        <div class='flex flex-column flex-row-ns justify-center h5-l'>
                          <div class='w-100 w-25-ns tc tr-ns mr0 mr4-m mr5-l'>
                            <img src='/offen-onboarding-2.svg' alt='Onboarding illustration 2' width='180' height='190' class='ma0' />
                          </div>
                          <div class='w-100 w-75-ns mt3 mt0-ns mb4 mb5-l'>
                            <div class='w-100 w-80-l lh-copy mt3-m mt4-l'>
                              <p class='f3 ma0 mb3'>
                                {__('Your data always stays yours.')}
                              </p>
                              <p class='ma0 mb1'>
                                {__('Review your data in the Auditorium and click (e) for detailed explanations of the respective terms.')}
                              </p>
                              <p class='ma0'>
                                {__('You can delete your data or opt out completly at any time in the Privacy tab.')}
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
                        <div class='flex flex-column flex-row-ns justify-center h5-l'>
                          <div class='w-100 w-25-ns tc tr-ns mr0 mr4-m mr5-l'>
                            <img src='/offen-onboarding-3.svg' alt='Onboarding illustration 3' width='180' height='190' class='ma0' />
                          </div>
                          <div class='w-100 w-75-ns mt3 mt0-ns mb4 mb5-l'>
                            <div class='w-100 w-80-l lh-copy mt3-m mt4-l'>
                              <p class='f3 ma0 mb3'>
                                {__('Review how you use coolblog.com over time.')}
                              </p>
                              <p class='ma0 mb1'>
                                {__('To get an overall picture about your data collected here over time, bookmark this page and come back later.')}
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
                              <a
                                class={classnames({
                                  pointer: true,
                                  mh2: true,
                                  colorSVG: true,
                                  colorSVGactive: index === activeItem
                                })}
                                role='button'
                              >
                                <svg width="8" height="8" viewBox="0 0 8 8" xmlns="http://www.w3.org/2000/svg">
                                  <circle cx="4" cy="4" r="4"></circle>
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
