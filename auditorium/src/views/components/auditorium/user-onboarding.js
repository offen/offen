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
      <div class='flex flex-column flex-row-l mt4'>
        <div class='w-100 flex bt bb ba-ns b--black-10 br0 br2-ns mb2-ns'>
          <div class='pa3 bg-white w-100'>


            <div class='cf'>
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
                        <div class='flex flex-column flex-row-ns justify-center'>
                          <div class=''>
                            IMAGE
                          </div>
                          <div class=''>
                            <p class='ma0'>
                              {__('Welcome to the Auditorium. You opted in for fair web analytics, this is how it works.')}
                            </p>
                            <p class='ma0'>
                              {__('What coolblog.com knows about you.')}
                            </p>
                            <p class='ma0'>
                              {__('You just have visited the page coolblog.com/nice-article. It is probably your first time on coolblog.com. You came here by a link on GitHub. Most likely your are on a deskop device.')}
                            </p>
                          </div>
                        </div>
                        <div class='flex justify-center'>
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
                        <p>{__('Slide 2 content')}</p>
                        <button onclick={onNext}>
                          {__('Next')}
                        </button>
                      </Fragment>
                    )
                  },
                  (props) => {
                    return (
                      <Fragment>
                        <p>{__('Slide 3 content')}</p>
                        <button onclick={onComplete}>
                          {__('Open Auditorium')}
                        </button>
                      </Fragment>
                    )
                  }
                ]}


                navigation={(props) => {
                  const { onChange, activeItem, numItems } = props
                  return (
                    <div class='flex justify-center'>

                      <ul>
                        {Array.from({ length: numItems }).map(function (el, index) {
                          return (
                            <li key={`slider-item-${index}`} onclick={() => onChange(index)}>
                              <a
                                class={classnames({
                                  pointer: true,
                                  b: index === activeItem
                                })}
                                role='button'
                              >
                                {index + 1}
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
